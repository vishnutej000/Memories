from datetime import datetime, timedelta
from typing import Union, Optional
import logging

logger = logging.getLogger(__name__)

def parse_date(date_string: str) -> Optional[datetime]:
    """
    Parse a date string into a datetime object.
    
    Args:
        date_string: Date string in various formats
    
    Returns:
        datetime: Parsed datetime or None if parsing fails
    """
    formats = [
        "%Y-%m-%d",  # 2023-05-18
        "%d/%m/%Y",  # 18/05/2023
        "%m/%d/%Y",  # 05/18/2023
        "%Y-%m-%dT%H:%M:%S",  # 2023-05-18T08:39:07
        "%Y-%m-%dT%H:%M:%SZ",  # 2023-05-18T08:39:07Z
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    
    logger.warning(f"Could not parse date string: {date_string}")
    return None

def format_date(date: Union[datetime, str], format_string: str = "%Y-%m-%d") -> str:
    """
    Format a date object or string as a string.
    
    Args:
        date: Date to format (datetime or string)
        format_string: Format to use
    
    Returns:
        str: Formatted date string
    """
    if isinstance(date, str):
        # Parse the string first
        parsed_date = parse_date(date)
        if not parsed_date:
            return date  # Return the original if parsing fails
        date = parsed_date
    
    return date.strftime(format_string)

def get_date_range(start_date: datetime, end_date: datetime) -> list[datetime]:
    """
    Get a list of dates between start_date and end_date.
    
    Args:
        start_date: Start date
        end_date: End date
    
    Returns:
        list[datetime]: List of dates in the range
    """
    delta = end_date - start_date
    return [start_date + timedelta(days=i) for i in range(delta.days + 1)]

def get_month_name(month: int) -> str:
    """
    Get the name of a month.
    
    Args:
        month: Month number (1-12)
    
    Returns:
        str: Month name
    """
    month_names = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ]
    
    if 1 <= month <= 12:
        return month_names[month - 1]
    else:
        return ""

def get_day_name(day: int) -> str:
    """
    Get the name of a day of the week.
    
    Args:
        day: Day number (0-6, where 0 is Monday)
    
    Returns:
        str: Day name
    """
    day_names = [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday"
    ]
    
    if 0 <= day <= 6:
        return day_names[day]
    else:
        return ""