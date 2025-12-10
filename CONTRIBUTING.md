# Contributing to IMPI

Thank you for your interest in contributing to the Intelligent Meeting Insights Platform (IMPI)! We appreciate your time and effort.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)
- [Code Review Process](#code-review-process)
- [Community](#community)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB 4.4+
- Git

### Setting Up the Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/IMPI.git
   cd IMPI
   ```

2. **Set Up Backend**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   # source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Set Up Frontend**
   ```bash
   cd frontend
   npm install
   ```

## Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes:
   # git checkout -b bugfix/issue-number-description
   ```

2. **Make Your Changes**
   - Follow the code style guidelines
   - Write tests for new features
   - Update documentation as needed

3. **Run Tests**
   ```bash
   # Backend tests
   pytest
   
   # Frontend tests
   cd frontend
   npm test
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "type(scope): concise description of changes"
   ```
   
   Commit message format:
   ```
   type(scope): subject
   
   [optional body]
   
   [optional footer]
   ```
   
   Types:
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation changes
   - style: Code style changes
   - refactor: Code changes that neither fix bugs nor add features
   - test: Adding missing tests or correcting existing tests
   - chore: Changes to the build process or auxiliary tools

5. **Push Your Changes**
   ```bash
   git push origin your-branch-name
   ```

6. **Open a Pull Request**
   - Fill in the PR template
   - Reference any related issues
   - Request reviews from maintainers

## Code Style Guide

### Python
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Use type hints for all new code
- Document public APIs with docstrings (Google style)
- Keep functions small and focused

### JavaScript/React
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use functional components with hooks
- Prop-types for all components
- Keep components small and reusable

## Reporting Issues

Before submitting an issue, please:
1. Check if the issue has already been reported
2. Try to reproduce the issue with the latest version

When reporting an issue, include:
- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, versions, etc.)

## Feature Requests

We welcome feature requests! Please:
1. Check if the feature has already been requested
2. Explain why this feature would be valuable
3. Include any relevant use cases

## Code Review Process

1. Automated checks (tests, linting) must pass
2. At least one maintainer must approve the PR
3. All comments must be addressed before merging
4. Squash and merge with a clear commit message

## Community

- Join our [Discord/Slack channel]()
- Follow us on [Twitter]()
- Read our [blog]()

## Need Help?

If you need help or have questions, please open an issue or reach out to us at [your-email@example.com](mailto:your-email@example.com).

Thank you for contributing to IMPI! 🚀
