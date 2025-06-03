#!/usr/bin/env python3
"""
Security Audit Script for WhatsApp Memory Vault Backend
Performs comprehensive security checks and vulnerability assessments.
"""

import os
import sys
import asyncio
import aiohttp
import json
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

class SeverityLevel(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

@dataclass
class SecurityFinding:
    category: str
    severity: SeverityLevel
    title: str
    description: str
    recommendation: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None

class SecurityAuditor:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.findings: List[SecurityFinding] = []
        
    def add_finding(self, finding: SecurityFinding):
        """Add a security finding to the audit results."""
        self.findings.append(finding)
        
    async def audit_dependencies(self):
        """Audit Python dependencies for known vulnerabilities."""
        print("🔍 Auditing Python dependencies...")
        
        requirements_path = Path("requirements.txt")
        if not requirements_path.exists():
            self.add_finding(SecurityFinding(
                category="Dependencies",
                severity=SeverityLevel.MEDIUM,
                title="Missing requirements.txt",
                description="No requirements.txt file found for dependency tracking",
                recommendation="Create requirements.txt with pinned versions"
            ))
            return
            
        # Check for common vulnerable packages
        vulnerable_patterns = [
            ("flask", "2.0.0", "CVE-2023-30861"),
            ("requests", "2.25.0", "CVE-2023-32681"),
            ("pillow", "9.0.0", "CVE-2023-4863"),
            ("cryptography", "3.0.0", "Multiple CVEs")
        ]
        
        with open(requirements_path) as f:
            content = f.read()
            
        for package, min_version, cve in vulnerable_patterns:
            if package in content.lower():
                self.add_finding(SecurityFinding(
                    category="Dependencies",
                    severity=SeverityLevel.HIGH,
                    title=f"Potentially vulnerable {package} dependency",
                    description=f"Package {package} may be vulnerable to {cve}",
                    recommendation=f"Ensure {package} >= {min_version}",
                    file_path="requirements.txt"
                ))
                
    async def audit_authentication(self):
        """Test authentication and authorization mechanisms."""
        print("🔒 Auditing authentication...")
        
        async with aiohttp.ClientSession() as session:
            # Test unauthenticated access to protected endpoints
            protected_endpoints = [
                "/api/v1/whatsapp/upload",
                "/api/v1/analysis/sentiment/test-chat",
                "/api/v1/export"
            ]
            
            for endpoint in protected_endpoints:
                try:
                    async with session.get(f"{self.base_url}{endpoint}") as response:
                        if response.status == 200:
                            self.add_finding(SecurityFinding(
                                category="Authentication",
                                severity=SeverityLevel.CRITICAL,
                                title=f"Unprotected endpoint: {endpoint}",
                                description=f"Endpoint {endpoint} accessible without authentication",
                                recommendation="Implement proper authentication middleware"
                            ))
                except Exception as e:
                    # Expected for testing purposes
                    pass
                    
    async def audit_input_validation(self):
        """Test input validation and sanitization."""
        print("🧹 Auditing input validation...")
        
        async with aiohttp.ClientSession() as session:
            # Test SQL injection patterns
            sql_payloads = [
                "'; DROP TABLE users; --",
                "1' OR '1'='1",
                "admin'/*",
                "' UNION SELECT * FROM information_schema.tables --"
            ]
            
            for payload in sql_payloads:
                try:
                    data = {"username": payload, "password": "test"}
                    async with session.post(f"{self.base_url}/api/v1/auth/login", json=data) as response:
                        if "error" not in await response.text():
                            self.add_finding(SecurityFinding(
                                category="Input Validation",
                                severity=SeverityLevel.CRITICAL,
                                title="Potential SQL injection vulnerability",
                                description=f"Payload '{payload}' may be processed unsafely",
                                recommendation="Implement parameterized queries and input sanitization"
                            ))
                except Exception:
                    pass
                    
            # Test XSS patterns
            xss_payloads = [
                "<script>alert('XSS')</script>",
                "javascript:alert('XSS')",
                "<img src=x onerror=alert('XSS')>",
                "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>"
            ]
            
            for payload in xss_payloads:
                try:
                    data = {"name": payload, "content": payload}
                    async with session.post(f"{self.base_url}/api/v1/journals", json=data) as response:
                        response_text = await response.text()
                        if payload in response_text and "text/html" in response.headers.get("content-type", ""):
                            self.add_finding(SecurityFinding(
                                category="Input Validation",
                                severity=SeverityLevel.HIGH,
                                title="Potential XSS vulnerability",
                                description=f"Payload '{payload[:50]}...' reflected in response",
                                recommendation="Implement proper output encoding and CSP headers"
                            ))
                except Exception:
                    pass
                    
    async def audit_file_upload(self):
        """Test file upload security."""
        print("📁 Auditing file upload security...")
        
        async with aiohttp.ClientSession() as session:
            # Test malicious file uploads
            malicious_files = [
                ("shell.php", b"<?php system($_GET['cmd']); ?>", "application/x-php"),
                ("test.exe", b"MZ\x90\x00" + b"\x00" * 100, "application/x-executable"),
                ("huge.txt", b"A" * (100 * 1024 * 1024), "text/plain"),  # 100MB file
                ("../../../etc/passwd", b"root:x:0:0:root:/root:/bin/bash", "text/plain")
            ]
            
            for filename, content, content_type in malicious_files:
                try:
                    data = aiohttp.FormData()
                    data.add_field('file', content, filename=filename, content_type=content_type)
                    
                    async with session.post(f"{self.base_url}/api/v1/whatsapp/upload", data=data) as response:
                        if response.status == 200:
                            self.add_finding(SecurityFinding(
                                category="File Upload",
                                severity=SeverityLevel.HIGH,
                                title=f"Malicious file upload accepted: {filename}",
                                description=f"File {filename} with type {content_type} was accepted",
                                recommendation="Implement strict file type validation and content scanning"
                            ))
                except Exception:
                    pass
                    
    async def audit_rate_limiting(self):
        """Test rate limiting implementation."""
        print("⏱️ Auditing rate limiting...")
        
        async with aiohttp.ClientSession() as session:
            # Test rapid requests
            start_time = time.time()
            success_count = 0
            
            tasks = []
            for i in range(100):  # Send 100 requests rapidly
                task = asyncio.create_task(self._make_request(session, "/api/v1/health"))
                tasks.append(task)
                
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, aiohttp.ClientResponse) and result.status == 200:
                    success_count += 1
                    
            elapsed = time.time() - start_time
            
            if success_count > 50 and elapsed < 5:  # More than 50 requests in under 5 seconds
                self.add_finding(SecurityFinding(
                    category="Rate Limiting",
                    severity=SeverityLevel.MEDIUM,
                    title="Insufficient rate limiting",
                    description=f"Accepted {success_count} requests in {elapsed:.2f} seconds",
                    recommendation="Implement proper rate limiting middleware"
                ))
                
    async def _make_request(self, session: aiohttp.ClientSession, endpoint: str):
        """Helper method to make HTTP requests."""
        try:
            async with session.get(f"{self.base_url}{endpoint}") as response:
                return response
        except Exception as e:
            return e
            
    async def audit_headers(self):
        """Audit security headers."""
        print("📋 Auditing security headers...")
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{self.base_url}/api/v1/health") as response:
                    headers = response.headers
                    
                    required_headers = {
                        "X-Content-Type-Options": "nosniff",
                        "X-Frame-Options": "DENY",
                        "X-XSS-Protection": "1; mode=block",
                        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
                        "Content-Security-Policy": "default-src 'self'"
                    }
                    
                    for header, expected_value in required_headers.items():
                        if header not in headers:
                            self.add_finding(SecurityFinding(
                                category="Security Headers",
                                severity=SeverityLevel.MEDIUM,
                                title=f"Missing security header: {header}",
                                description=f"Response lacks {header} header",
                                recommendation=f"Add {header}: {expected_value}"
                            ))
                        elif not headers[header].startswith(expected_value.split(';')[0]):
                            self.add_finding(SecurityFinding(
                                category="Security Headers",
                                severity=SeverityLevel.LOW,
                                title=f"Weak security header: {header}",
                                description=f"Header {header} has value: {headers[header]}",
                                recommendation=f"Consider strengthening to: {expected_value}"
                            ))
            except Exception as e:
                self.add_finding(SecurityFinding(
                    category="Infrastructure",
                    severity=SeverityLevel.HIGH,
                    title="Server unreachable",
                    description=f"Could not connect to {self.base_url}: {str(e)}",
                    recommendation="Ensure server is running and accessible"
                ))
                
    def audit_code_patterns(self):
        """Audit source code for security anti-patterns."""
        print("💻 Auditing code patterns...")
        
        src_path = Path("src")
        if not src_path.exists():
            return
            
        dangerous_patterns = [
            (r"eval\(", "Code injection risk"),
            (r"exec\(", "Code execution risk"),
            (r"os\.system\(", "Command injection risk"),
            (r"subprocess\.call\(.*shell=True", "Shell injection risk"),
            (r"password.*=.*['\"][^'\"]*['\"]", "Hardcoded password"),
            (r"secret.*=.*['\"][^'\"]*['\"]", "Hardcoded secret"),
            (r"api_key.*=.*['\"][^'\"]*['\"]", "Hardcoded API key"),
            (r"pickle\.loads?\(", "Deserialization vulnerability"),
            (r"yaml\.load\(", "YAML deserialization risk")
        ]
        
        import re
        
        for py_file in src_path.rglob("*.py"):
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.split('\n')
                    
                for i, line in enumerate(lines, 1):
                    for pattern, description in dangerous_patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            self.add_finding(SecurityFinding(
                                category="Code Security",
                                severity=SeverityLevel.HIGH,
                                title=f"Dangerous pattern: {description}",
                                description=f"Found pattern '{pattern}' in code",
                                recommendation="Review and implement secure alternatives",
                                file_path=str(py_file),
                                line_number=i
                            ))
            except Exception as e:
                print(f"Error reading {py_file}: {e}")
                
    def audit_configuration(self):
        """Audit configuration files for security issues."""
        print("⚙️ Auditing configuration...")
        
        config_files = [
            ".env",
            "config.py",
            "settings.py",
            "docker-compose.yml",
            "Dockerfile"
        ]
        
        for config_file in config_files:
            if Path(config_file).exists():
                try:
                    with open(config_file, 'r') as f:
                        content = f.read()
                        
                    # Check for exposed secrets
                    if any(word in content.lower() for word in ['password', 'secret', 'key', 'token']):
                        if any(char in content for char in ['=', ':']):
                            self.add_finding(SecurityFinding(
                                category="Configuration",
                                severity=SeverityLevel.MEDIUM,
                                title=f"Potential secrets in {config_file}",
                                description=f"File {config_file} may contain sensitive information",
                                recommendation="Use environment variables for secrets",
                                file_path=config_file
                            ))
                            
                    # Check for debug mode
                    if "debug" in content.lower() and "true" in content.lower():
                        self.add_finding(SecurityFinding(
                            category="Configuration",
                            severity=SeverityLevel.MEDIUM,
                            title=f"Debug mode enabled in {config_file}",
                            description="Debug mode should be disabled in production",
                            recommendation="Set debug=False in production",
                            file_path=config_file
                        ))
                except Exception as e:
                    print(f"Error reading {config_file}: {e}")
                    
    async def run_audit(self):
        """Run complete security audit."""
        print("🛡️ Starting comprehensive security audit...")
        print("=" * 60)
        
        # Code-based audits (synchronous)
        self.audit_code_patterns()
        self.audit_configuration()
        await self.audit_dependencies()
        
        # Network-based audits (asynchronous)
        try:
            await self.audit_headers()
            await self.audit_authentication()
            await self.audit_input_validation()
            await self.audit_file_upload()
            await self.audit_rate_limiting()
        except Exception as e:
            print(f"Network audit error: {e}")
            
        # Generate report
        self.generate_report()
        
    def generate_report(self):
        """Generate comprehensive security audit report."""
        print("\n🔍 SECURITY AUDIT REPORT")
        print("=" * 60)
        
        # Summary
        severity_counts = {severity: 0 for severity in SeverityLevel}
        for finding in self.findings:
            severity_counts[finding.severity] += 1
            
        print(f"\nSUMMARY:")
        print(f"Total findings: {len(self.findings)}")
        for severity, count in severity_counts.items():
            if count > 0:
                emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🔵", "INFO": "⚪"}
                print(f"{emoji[severity.value]} {severity.value}: {count}")
                
        # Detailed findings
        print(f"\nDETAILED FINDINGS:")
        print("-" * 40)
        
        for i, finding in enumerate(self.findings, 1):
            print(f"\n{i}. {finding.title}")
            print(f"   Severity: {finding.severity.value}")
            print(f"   Category: {finding.category}")
            print(f"   Description: {finding.description}")
            print(f"   Recommendation: {finding.recommendation}")
            if finding.file_path:
                location = f"{finding.file_path}"
                if finding.line_number:
                    location += f":{finding.line_number}"
                print(f"   Location: {location}")
                
        # Recommendations
        print(f"\n📋 PRIORITY RECOMMENDATIONS:")
        print("-" * 40)
        
        critical_high = [f for f in self.findings if f.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH]]
        
        if critical_high:
            print("\n🔴 IMMEDIATE ACTION REQUIRED:")
            for finding in critical_high:
                print(f"• {finding.title}: {finding.recommendation}")
        else:
            print("✅ No critical or high severity issues found!")
            
        print(f"\n📊 AUDIT COMPLETE - {len(self.findings)} total findings")
        
        # Save JSON report
        report_data = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "summary": {severity.value: severity_counts[severity] for severity in SeverityLevel},
            "findings": [
                {
                    "category": f.category,
                    "severity": f.severity.value,
                    "title": f.title,
                    "description": f.description,
                    "recommendation": f.recommendation,
                    "file_path": f.file_path,
                    "line_number": f.line_number
                }
                for f in self.findings
            ]
        }
        
        with open("security_audit_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
            
        print(f"📄 Detailed report saved to: security_audit_report.json")

async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Security audit for WhatsApp Memory Vault")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL for API testing")
    args = parser.parse_args()
    
    auditor = SecurityAuditor(args.url)
    await auditor.run_audit()

if __name__ == "__main__":
    asyncio.run(main())
