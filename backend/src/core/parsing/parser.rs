use pyo3::prelude::*;
use chrono::{DateTime, Utc, NaiveDateTime, TimeZone};
use regex::Regex;
use serde::{Serialize, Deserialize};
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
struct Message {
    id: String,
    timestamp: String,
    sender: String,
    content: String,
    message_type: String,
}

/// Parse a WhatsApp chat export file and extract messages
#[pyfunction]
fn parse_whatsapp_chat(file_path: &str, user_identity: &str) -> PyResult<Vec<PyObject>> {
    let python_gil = Python::acquire_gil();
    let py = python_gil.python();
    
    // Multiple regex patterns for different WhatsApp formats
    let patterns = vec![
        Regex::new(r"^\[(\d{1,2}/\d{1,2}/\d{4}, \d{1,2}:\d{2}:\d{2})\] ([^:]+): (.+)$").unwrap(),
        Regex::new(r"^(\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2} (?:AM|PM|am|pm)) - ([^:]+): (.+)$").unwrap(),
        Regex::new(r"^(\d{1,2}/\d{1,2}/\d{4}, \d{1,2}:\d{2}) - ([^:]+): (.+)$").unwrap(),
        Regex::new(r"^(\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2}) - ([^:]+): (.+)$").unwrap(),
    ];
    
    // System message patterns to exclude
    let system_patterns = vec![
        Regex::new(r"Messages and calls are end-to-end encrypted").unwrap(),
        Regex::new(r"You created group").unwrap(),
        Regex::new(r"created this group").unwrap(),
        Regex::new(r"added you").unwrap(),
        Regex::new(r"removed").unwrap(),
        Regex::new(r"left").unwrap(),
        Regex::new(r"Security code changed").unwrap(),
        Regex::new(r"<Media omitted>").unwrap(),
        Regex::new(r"This message was deleted").unwrap(),
    ];
    
    // System message line pattern (no participant name)
    let system_line_pattern = Regex::new(r"^\d{1,2}/\d{1,2}/\d{2,4}, \d{1,2}:\d{2} (?:AM|PM|am|pm) - [^:]*$").unwrap();
    
    fn is_system_message(content: &str, patterns: &Vec<Regex>) -> bool {
        patterns.iter().any(|pattern| pattern.is_match(content))
    }
    
    // Open the file
    let file = match File::open(Path::new(file_path)) {
        Ok(file) => file,
        Err(e) => return Err(PyErr::new::<pyo3::exceptions::PyIOError, _>(format!("Failed to open file: {}", e))),
    };
    
    let reader = BufReader::new(file);
    let mut messages = Vec::new();
    let mut message_id = 0;
    let mut current_message: Option<Message> = None;
      // Process each line
    for line in reader.lines() {
        let line = match line {
            Ok(line) => line,
            Err(e) => return Err(PyErr::new::<pyo3::exceptions::PyIOError, _>(format!("Failed to read line: {}", e))),
        };
        
        // Skip lines that are clearly system messages without participants
        if system_line_pattern.is_match(&line) {
            continue;
        }
        
        // Try each pattern to find a match
        let mut found_match = false;
        for pattern in &patterns {
            if let Some(captures) = pattern.captures(&line) {
                // If we have a current message being built, finalize it
                if let Some(mut message) = current_message.take() {
                    message_id += 1;
                    
                    // Determine message type based on content
                    if message.content.contains("<Media omitted>") {
                        message.message_type = "media".to_string();
                    } else if message.content.starts_with("https://") || message.content.starts_with("http://") {
                        message.message_type = "link".to_string();
                    } else {
                        message.message_type = "text".to_string();
                    }
                    
                    // Convert to Python dict
                    let py_message = pyo3::types::PyDict::new(py);
                    py_message.set_item("id", format!("msg_{}", message_id))?;
                    py_message.set_item("timestamp", message.timestamp)?;
                    py_message.set_item("sender", message.sender)?;
                    py_message.set_item("content", message.content)?;
                    py_message.set_item("type", message.message_type)?;
                    
                    messages.push(py_message.to_object(py));
                }
                
                // Extract data from the new message
                let timestamp_str = captures.get(1).unwrap().as_str();
                let sender = captures.get(2).unwrap().as_str().to_string();
                let content = captures.get(3).unwrap().as_str().to_string();
                
                // Skip system messages based on content
                if is_system_message(&content, &system_patterns) {
                    current_message = None;
                    found_match = true;
                    break;
                }
                
                // Parse and format the timestamp
                let dt = match parse_whatsapp_timestamp(timestamp_str) {
                    Ok(dt) => dt,
                    Err(e) => return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                        format!("Failed to parse timestamp: {}", e)
                    )),
                };
                
                // Create new message
                current_message = Some(Message {
                    id: format!("msg_{}", message_id + 1),
                    timestamp: dt.to_rfc3339(),
                    sender: sender,
                    content: content,
                    message_type: "text".to_string(), // Default type, will be updated later
                });
                
                found_match = true;
                break;
            }
        }
        
        if !found_match {
            if let Some(ref mut message) = current_message {
                // If this line doesn't match any pattern, it's a continuation of the previous message
                message.content.push_str("\n");
                message.content.push_str(&line);
            }
        }
    }
    
    // Don't forget the last message
    if let Some(mut message) = current_message {
        message_id += 1;
        
        // Determine message type
        if message.content.contains("<Media omitted>") {
            message.message_type = "media".to_string();
        } else if message.content.starts_with("https://") || message.content.starts_with("http://") {
            message.message_type = "link".to_string();
        } else {
            message.message_type = "text".to_string();
        }
        
        // Convert to Python dict
        let py_message = pyo3::types::PyDict::new(py);
        py_message.set_item("id", format!("msg_{}", message_id))?;
        py_message.set_item("timestamp", message.timestamp)?;
        py_message.set_item("sender", message.sender)?;
        py_message.set_item("content", message.content)?;
        py_message.set_item("type", message.message_type)?;
        
        messages.push(py_message.to_object(py));
    }
    
    Ok(messages)
}

/// Parse WhatsApp timestamp in format "DD/MM/YYYY, HH:MM:SS"
fn parse_whatsapp_timestamp(timestamp_str: &str) -> Result<DateTime<Utc>, String> {
    let timestamp_pattern = Regex::new(r"(\d{2})/(\d{2})/(\d{4}), (\d{2}):(\d{2}):(\d{2})").unwrap();
    
    if let Some(captures) = timestamp_pattern.captures(timestamp_str) {
        let day = captures.get(1).unwrap().as_str().parse::<u32>().unwrap();
        let month = captures.get(2).unwrap().as_str().parse::<u32>().unwrap();
        let year = captures.get(3).unwrap().as_str().parse::<i32>().unwrap();
        let hour = captures.get(4).unwrap().as_str().parse::<u32>().unwrap();
        let minute = captures.get(5).unwrap().as_str().parse::<u32>().unwrap();
        let second = captures.get(6).unwrap().as_str().parse::<u32>().unwrap();
        
        let naive_dt = match NaiveDateTime::new(
            chrono::NaiveDate::from_ymd_opt(year, month, day).unwrap_or_default(),
            chrono::NaiveTime::from_hms_opt(hour, minute, second).unwrap_or_default()
        ) {
            Some(dt) => dt,
            None => return Err("Invalid date/time components".to_string()),
        };
        
        Ok(Utc.from_utc_datetime(&naive_dt))
    } else {
        Err("Timestamp doesn't match expected format".to_string())
    }
}

/// Function to check if a string contains a URL
fn contains_url(text: &str) -> bool {
    let url_pattern = Regex::new(r"https?://\S+").unwrap();
    url_pattern.is_match(text)
}

/// Register Python module
#[pymodule]
fn whatsapp_parser(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(parse_whatsapp_chat, m)?)?;
    Ok(())
}