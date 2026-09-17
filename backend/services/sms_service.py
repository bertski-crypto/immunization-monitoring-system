"""
SMS Service for Philippine SMS Providers (based on ridvanbaluyos/sms)

Supports:
- Semaphore (https://semaphore.co / http://api.semaphore.co/api/v4/messages)
- PromoTexter (http://www.promotexter.com)
- RisingTide (http://www.risingtide.ph)
- Generic REST SMS Gateway / Mock for local development & capstone demos
"""

import re
import json
import requests
from config import Config


def format_philippine_number(phone_number):
    """
    Format mobile number to standard Philippine format (09XXXXXXXXX or 639XXXXXXXXX)
    """
    cleaned = re.sub(r'[\s\-\(\)]', '', str(phone_number))
    if cleaned.startswith('+63'):
        cleaned = '0' + cleaned[3:]
    elif cleaned.startswith('63'):
        cleaned = '0' + cleaned[2:]
    return cleaned


def send_sms_notification(recipient_number, message):
    """
    Send SMS notification via Philippine SMS gateway (Semaphore / PromoTexter / ridvanbaluyos-sms spec)
    
    Args:
        recipient_number: Phone number to send to (e.g., 09171234567)
        message: SMS message content
    
    Returns:
        dict: Result with status ('sent', 'failed'), message_id, provider, and error
    """
    try:
        # Check for development/mock mode
        api_key = Config.SMS_API_KEY
        if not api_key or api_key.lower() in ('mock', 'dev', 'none'):
            return {
                'status': 'sent',
                'message_id': f'MOCK-PH-{recipient_number[-4:] if len(str(recipient_number)) >= 4 else "0000"}',
                'provider': 'Mock/Development',
                'error': None
            }
        
        formatted_number = format_philippine_number(recipient_number)
        api_url = Config.SMS_API_URL or 'https://api.semaphore.co/api/v4/messages'
        sender_name = Config.SMS_SENDER_NAME or 'BrgyHomapon'
        
        # Determine provider based on URL or configuration
        if 'semaphore' in api_url.lower():
            # Semaphore API (POST to https://api.semaphore.co/api/v4/messages)
            payload = {
                'apikey': api_key,
                'number': formatted_number,
                'message': message,
                'sender_name': sender_name
            }
            response = requests.post(api_url, data=payload, timeout=15)
            
            if response.status_code in (200, 201):
                res_data = response.json()
                if isinstance(res_data, list) and len(res_data) > 0:
                    item = res_data[0]
                    return {
                        'status': 'sent',
                        'message_id': str(item.get('message_id', '')),
                        'provider': 'Semaphore',
                        'error': None
                    }
                elif isinstance(res_data, dict):
                    return {
                        'status': 'sent',
                        'message_id': str(res_data.get('message_id', '')),
                        'provider': 'Semaphore',
                        'error': None
                    }
            return {
                'status': 'failed',
                'message_id': None,
                'provider': 'Semaphore',
                'error': f'Semaphore error ({response.status_code}): {response.text}'
            }
            
        elif 'promotexter' in api_url.lower():
            # PromoTexter API
            payload = {
                'apiKey': api_key,
                'to': formatted_number,
                'text': message,
                'from': sender_name
            }
            response = requests.post(api_url, json=payload, timeout=15)
            if response.status_code in (200, 201):
                res_data = response.json()
                return {
                    'status': 'sent',
                    'message_id': str(res_data.get('id', '')),
                    'provider': 'PromoTexter',
                    'error': None
                }
            return {
                'status': 'failed',
                'message_id': None,
                'provider': 'PromoTexter',
                'error': f'PromoTexter error ({response.status_code}): {response.text}'
            }
            
        else:
            # Generic Philippine Gateway API fallback
            payload = {
                'apikey': api_key,
                'number': formatted_number,
                'message': message,
                'sender': sender_name
            }
            response = requests.post(api_url, data=payload, timeout=15)
            if response.status_code in (200, 201):
                return {
                    'status': 'sent',
                    'message_id': 'GENERIC-OK',
                    'provider': 'Custom SMS Gateway',
                    'error': None
                }
            return {
                'status': 'failed',
                'message_id': None,
                'provider': 'Custom SMS Gateway',
                'error': f'Gateway error ({response.status_code}): {response.text}'
            }
            
    except requests.RequestException as e:
        return {
            'status': 'failed',
            'message_id': None,
            'provider': 'Network',
            'error': f'Network connection error: {str(e)}'
        }
    except Exception as e:
        return {
            'status': 'failed',
            'message_id': None,
            'provider': 'System',
            'error': str(e)
        }


def format_reminder_message(child_name, vaccine_name, due_date):
    """Format vaccination reminder message"""
    return (
        f"Reminder: {child_name} is due for {vaccine_name} vaccination "
        f"on {due_date}. Please visit Barangay Homapon Health Center. "
        f"- BrgyHomapon Health"
    )


def format_overdue_message(child_name, vaccine_name, days_overdue):
    """Format overdue vaccination message"""
    return (
        f"IMPORTANT: {child_name}'s {vaccine_name} vaccination is "
        f"{days_overdue} days overdue. Please schedule immediately at "
        f"Barangay Homapon Health Center. - BrgyHomapon Health"
    )


def format_upcoming_message(child_name, vaccine_name, due_date):
    """Format upcoming vaccination message"""
    return (
        f"Hi! {child_name} has an upcoming {vaccine_name} vaccination "
        f"scheduled for {due_date}. Barangay Homapon Health Center. "
        f"- BrgyHomapon Health"
    )


def format_completion_message(child_name):
    """Format immunization completion message"""
    return (
        f"Congratulations! {child_name} has completed all required immunizations. "
        f"Thank you for prioritizing your child's health. "
        f"- BrgyHomapon Health"
    )
