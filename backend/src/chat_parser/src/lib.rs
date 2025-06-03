use pyo3::prelude::*;
use chrono::{DateTime, Local, NaiveDateTime};
use regex::Regex;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, BufRead, BufReader};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub timestamp: DateTime<Local>,
    pub sender: String,
    pub content: String,
    pub message_type: MessageType,
    pub sentiment_score: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum MessageType {
    Text,
    Media,
    Card,
    VoiceNote,
}

#[pyclass]
pub struct ChatParser {
    date_formats: Vec<String>,
    sender_pattern: Regex,
    message_pattern: Regex,
}

#[pymethods]
impl ChatParser {
    #[new]
    pub fn new() -> Self {
        ChatParser {
            date_formats: vec![
                "%d/%m/%y, %H:%M:%S".to_string(),
                "%m/%d/%y, %H:%M:%S".to_string(),
                "%Y-%m-%d %H:%M:%S".to_string(),
            ],
            sender_pattern: Regex::new(r"^(.+?):").unwrap(),
            message_pattern: Regex::new(r"^\[?(\d{1,2}/\d{1,2}/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?)\]?\s+(.+?):\s+(.+)$").unwrap(),
        }
    }

    pub fn parse_chat(&self, file_path: &str) -> PyResult<Vec<Message>> {
        let file = File::open(file_path)?;
        let reader = BufReader::new(file);
        let mut messages = Vec::new();

        for line in reader.lines() {
            if let Ok(line) = line {
                if let Some(captures) = self.message_pattern.captures(&line) {
                    let timestamp_str = captures.get(1).unwrap().as_str();
                    let sender = captures.get(2).unwrap().as_str().trim().to_string();
                    let content = captures.get(3).unwrap().as_str().trim().to_string();

                    let timestamp = self.parse_timestamp(timestamp_str)?;
                    let message_type = self.detect_message_type(&content);

                    messages.push(Message {
                        timestamp,
                        sender,
                        content,
                        message_type,
                        sentiment_score: None,
                    });
                }
            }
        }

        Ok(messages)
    }

    pub fn detect_senders(&self, file_path: &str) -> PyResult<Vec<String>> {
        let file = File::open(file_path)?;
        let reader = BufReader::new(file);
        let mut senders = HashMap::new();

        for line in reader.lines() {
            if let Ok(line) = line {
                if let Some(captures) = self.sender_pattern.captures(&line) {
                    let sender = captures.get(1).unwrap().as_str().trim().to_string();
                    senders.insert(sender, true);
                }
            }
        }

        Ok(senders.keys().cloned().collect())
    }

    fn parse_timestamp(&self, timestamp_str: &str) -> PyResult<DateTime<Local>> {
        for format in &self.date_formats {
            if let Ok(dt) = NaiveDateTime::parse_from_str(timestamp_str, format) {
                return Ok(DateTime::from_naive_utc_and_offset(dt, Local::now().offset().clone()));
            }
        }
        Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
            "Invalid timestamp format"
        ))
    }

    fn detect_message_type(&self, content: &str) -> MessageType {
        if content.contains("<Media omitted>") {
            MessageType::Media
        } else if content.contains("Voice note") {
            MessageType::VoiceNote
        } else if content.contains("Contact card") {
            MessageType::Card
        } else {
            MessageType::Text
        }
    }
}

#[pymodule]
fn chat_parser(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<ChatParser>()?;
    Ok(())
} 