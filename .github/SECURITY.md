# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**IMPORTANT**: Do not report security vulnerabilities through public GitHub issues.

If you discover a security vulnerability in IMPI, please report it by emailing [your-email@example.com](mailto:your-email@example.com) with the subject line "IMPI Security Vulnerability".

### What to Include

Please include the following details in your report:

- A description of the vulnerability
- Steps to reproduce the issue
- Impact of the vulnerability
- Any suggested fixes or mitigation steps
- Your contact information (optional)

### Our Commitment

- We will acknowledge your email within 48 hours
- We will send a more detailed response within 72 hours
- We will keep you informed of the progress towards fixing the issue
- We will credit you in our security advisories (if you wish)

## Security Updates

Security updates are released as patch versions (e.g., 1.0.0 → 1.0.1). We recommend always running the latest version.

## Secure Development Practices

### Code Review
- All code changes are peer-reviewed before merging
- Security-sensitive changes require additional review
- We use automated security scanning tools

### Dependencies
- Dependencies are regularly audited using `safety` and `npm audit`
- Security updates are applied promptly

### Data Protection
- Sensitive data is never logged
- All data is encrypted in transit (HTTPS/TLS)
- Passwords are hashed using bcrypt

### Infrastructure
- Regular security updates are applied to all systems
- Access is restricted based on the principle of least privilege
- Security headers are enabled by default
