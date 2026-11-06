# 🤝 Contributing to PromptPilot

Thank you for your interest in contributing to **PromptPilot**!

PromptPilot is an AI prompt engineering workspace designed to help users create, organize, test, compare, and improve prompts across AI models.

Contributions help make the application more useful, reliable, accessible, and efficient.

Whether you are fixing a bug, improving the interface, developing an AI integration, or updating documentation, your contribution is welcome.

---

# 📌 Table of Contents

1. Getting Started
2. Development Requirements
3. Setting Up the Project
4. Types of Contributions
5. Contribution Guidelines
6. Coding Standards
7. Working with Prompt Engineering Features
8. AI Integration Guidelines
9. UI and Accessibility Guidelines
10. Reporting Bugs
11. Suggesting Features
12. Submitting Changes
13. Pull Request Checklist
14. Code of Conduct

---

# 1. Getting Started

Before contributing, familiarize yourself with PromptPilot and its existing features.

PromptPilot is designed around a centralized prompt engineering workflow that includes:

- Workspace Overview
- Flight Deck Navigation
- Prompt Library
- Prompt Editor
- AI Playground
- Compare Lab
- Prompt Version History
- Prompt Templates
- Analytics Dashboard
- Gemini API Integration
- Experiment History
- Workspace Data Import and Export

Contributions should support the project's goal of making prompt creation, experimentation, and management more organized and accessible.

---

# 2. Development Requirements

Before starting development, ensure that you have the following tools installed:

- **Node.js** — JavaScript runtime
- **npm** — Package manager
- **Git** — Version control system
- **Visual Studio Code** or another code editor
- **Modern Web Browser** — For testing the application

Basic familiarity with the following technologies is recommended:

- React
- TypeScript
- JavaScript
- HTML5
- CSS3
- Vite
- Node.js
- Express.js
- REST API concepts
- Google Gemini API
- Git and GitHub

---

# 3. Setting Up the Project

Follow these steps to prepare your local development environment.

## Step 1: Fork the Repository

Fork the PromptPilot repository to your own GitHub account.

Repository: [PromptPilot on GitHub](https://github.com/rheillunio2-byte/Prompt-Pilot)

## Step 2: Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/Prompt-Pilot.git
```

Replace `YOUR-USERNAME` with your GitHub username.

## Step 3: Enter the Project Directory

```bash
cd Prompt-Pilot
```

## Step 4: Install Dependencies

```bash
npm install
```

If you are using Windows PowerShell and encounter an execution-policy error, use:

```powershell
npm.cmd install
```

## Step 5: Configure Environment Variables

Create a `.env` file inside the server directory.

Use the provided `.env.example` as a reference.

Example configuration:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

Obtain your API key through [Google AI Studio](https://aistudio.google.com/app/apikey).

**Never commit your actual API key or `.env` file to the repository.**

## Step 6: Run the Development Server

```bash
npm run dev
```

Alternatively, on Windows PowerShell:

```powershell
npm.cmd run dev
```

Open the local URL displayed in your terminal to access PromptPilot.

## Step 7: Create a Branch

Create a separate branch for your contribution.

For a new feature:

```bash
git checkout -b feature/your-feature-name
```

For a bug fix:

```bash
git checkout -b fix/your-bug-name
```

For UI improvements:

```bash
git checkout -b ui/your-improvement-name
```

Use a clear branch name that describes the purpose of your changes.

---

# 4. Types of Contributions

## 🐛 Bug Fixes

You can help improve PromptPilot by identifying and correcting issues such as:

- Prompts not saving correctly.
- Incorrect variable replacement.
- Broken prompt editing.
- Failed AI generation requests.
- Incorrect model selection.
- Compare Lab execution errors.
- Version restoration problems.
- Import or export issues.
- Incorrect analytics information.
- Browser storage problems.
- Responsive layout issues.
- Broken navigation or buttons.

## ✨ Feature Improvements

Possible contributions include:

- Additional prompt organization options.
- Improved prompt search and filtering.
- More flexible prompt variables.
- Additional AI provider integrations.
- Prompt evaluation and scoring.
- Advanced experiment management.
- Improved version comparison.
- Custom prompt templates.
- Better analytics and reporting.
- Workspace backup improvements.
- Collaboration features.
- AI-assisted prompt optimization.

## 🎨 User Interface Improvements

Contributions to the design and usability of PromptPilot are welcome.

Examples include:

- Improved typography and spacing.
- Better Flight Deck navigation.
- More intuitive prompt editing.
- Improved Playground layouts.
- Better Compare Lab visualization.
- More accessible color contrast.
- Improved responsive behavior.
- Better empty and loading states.
- Consistent component styling.
- Improved keyboard navigation.

## 📚 Documentation Improvements

You may also contribute by:

- Correcting documentation errors.
- Improving installation instructions.
- Adding usage examples.
- Updating feature descriptions.
- Documenting API integrations.
- Clarifying technical limitations.
- Improving the README.
- Adding screenshots or demonstrations.

---

# 5. Contribution Guidelines

To maintain project quality, please follow these guidelines:

1. Keep contributions relevant to PromptPilot.
2. Preserve existing functionality unless a change is intentional.
3. Use clear and descriptive names for variables, functions, and components.
4. Keep code organized and readable.
5. Avoid introducing unnecessary dependencies.
6. Test changes before submitting them.
7. Avoid committing generated files or unrelated changes.
8. Update documentation when a contribution changes application behavior.
9. Explain significant changes clearly in your pull request.
10. Never commit API keys, passwords, or private credentials.
11. Do not replace functional features with static mockups.
12. Maintain compatibility with the existing project architecture whenever possible.

---

# 6. Coding Standards

Consistency helps make PromptPilot easier to maintain and improve.

## React and TypeScript

- Use clear and meaningful names.
- Prefer reusable components where appropriate.
- Keep components focused on their intended responsibilities.
- Use TypeScript types and interfaces to describe data.
- Handle invalid inputs and errors gracefully.
- Avoid unnecessary duplication.
- Remove unused imports and variables.
- Follow existing component and file organization patterns.

## Styling

- Maintain consistent spacing and typography.
- Follow the project's existing design system.
- Keep layouts responsive.
- Avoid unnecessary CSS overrides.
- Maintain readable and organized styles.
- Use consistent icons and visual elements.
- Avoid excessive decorative elements.

## Backend Development

- Keep API routes organized.
- Validate incoming request data.
- Handle API errors appropriately.
- Avoid exposing sensitive information.
- Keep provider credentials on the backend.
- Use environment variables for configuration.
- Maintain consistent response structures.

## File Organization

Place code in appropriate directories and files.

Avoid placing unrelated application logic into one component or module when it can reasonably be separated into reusable components and services.

---

# 7. Working with Prompt Engineering Features

Prompt management and experimentation are among PromptPilot's most important components.

When modifying or adding prompt-related functionality, ensure that:

- Prompts can be created and edited correctly.
- Prompt titles and descriptions remain consistent.
- Dynamic variables are detected properly.
- Variable values are replaced correctly.
- Empty or missing variables are handled appropriately.
- Prompt data remains consistent across relevant sections.
- Existing prompts are not unintentionally overwritten.
- Version history behaves consistently.
- Import and export preserve supported prompt information.

## Dynamic Variable Guidelines

PromptPilot uses double curly braces for dynamic variables.

Example:

```text
Write a {{content_type}} about {{topic}}.

The intended audience is {{audience}}.
Use a {{tone}} tone.
```

When working with variables:

- Detect valid variable names consistently.
- Avoid replacing unrelated text.
- Handle repeated variables correctly.
- Validate required values before execution.
- Preserve the original prompt template.
- Ensure variable replacement works with special characters where applicable.

## Prompt Library Guidelines

When improving the Prompt Library:

- Preserve existing prompt information.
- Keep search and filtering accurate.
- Ensure favorites remain consistent.
- Handle editing and deletion properly.
- Maintain a clear organization system.
- Avoid unnecessary duplication.

## Version History Guidelines

When modifying version-related functionality:

- Preserve previous revisions.
- Ensure restored prompts contain the correct information.
- Avoid accidentally deleting unrelated versions.
- Maintain accurate version information.
- Clearly communicate restoration actions to users.

---

# 8. AI Integration Guidelines

AI provider integrations should be reliable, secure, and maintainable.

When working with Gemini or adding additional AI providers, consider the following:

## API Key Security

- Never hardcode API keys in source code.
- Never expose provider credentials in frontend code.
- Use environment variables.
- Keep `.env` files out of version control.
- Use `.env.example` for placeholder configuration.
- Never include real credentials in screenshots, logs, or documentation.

## API Request Handling

- Validate user input before sending requests.
- Handle invalid API configurations.
- Display meaningful error messages.
- Handle loading and execution states properly.
- Consider API rate limits.
- Handle network failures gracefully.
- Avoid unnecessary repeated requests.

## Model Integration

When adding a new AI provider or model:

- Document the required configuration.
- Clearly identify supported models.
- Preserve existing integrations.
- Use a consistent request and response structure where practical.
- Handle provider-specific errors.
- Do not advertise a model as supported unless its integration works.

## Compare Lab Guidelines

Compare Lab should provide a consistent way to evaluate different prompt approaches or supported models.

When modifying this feature:

- Ensure both experiments use the intended prompt configurations.
- Handle shared variables correctly.
- Display results in the correct comparison panels.
- Handle independent execution failures.
- Avoid presenting failed requests as successful results.
- Keep execution information accurate.

---

# 9. UI and Accessibility Guidelines

PromptPilot should maintain a clean, organized, and professional interface.

When contributing UI changes:

- Prioritize usability over decoration.
- Maintain clear visual hierarchy.
- Preserve the Flight Deck navigation identity.
- Keep typography and spacing consistent.
- Avoid excessive cards and unnecessary visual clutter.
- Ensure controls are easy to identify.
- Provide helpful empty and error states.
- Maintain responsive layouts.
- Consider keyboard navigation.
- Use accessible labels for interactive elements.
- Maintain sufficient color contrast.
- Ensure important actions provide clear feedback.

For major visual changes, include screenshots in your pull request.

---

# 10. Reporting Bugs

If you encounter a problem, report it through the repository's GitHub Issues section.

Repository: [PromptPilot Issues](https://github.com/rheillunio2-byte/Prompt-Pilot/issues)

A useful bug report should include:

**Title:** A short description of the problem.

**Description:** Explain what happened and what you expected to happen.

**Steps to Reproduce:** Provide the steps needed to reproduce the issue.

**Expected Behavior:** Describe the correct result.

**Actual Behavior:** Describe what happened instead.

**Environment:** Include relevant information such as:

- Operating system
- Browser
- Node.js version
- Application version or commit
- AI provider and model, when relevant

**Screenshots or Examples:** Include screenshots, sample prompts, or error messages when useful.

For AI-related bugs, include the relevant prompt structure and model configuration, but never include private API keys or credentials.

---

# 11. Suggesting Features

Feature suggestions are welcome.

Before submitting a suggestion:

1. Check whether a similar request already exists.
2. Explain the problem the feature addresses.
3. Describe how the feature should work.
4. Explain how it would improve PromptPilot.
5. Include examples or references when useful.

Suggestions should be practical and consistent with PromptPilot's purpose as an AI prompt engineering workspace.

---

# 12. Submitting Changes

After completing your changes, review and test them before committing.

## Step 1: Check Your Changes

```bash
git status
```

## Step 2: Stage the Relevant Files

```bash
git add .
```

Only stage files that belong to your contribution.

## Step 3: Commit Your Changes

Use a clear and descriptive commit message.

```bash
git commit -m "Improve prompt editor interface"
```

Other examples:

```bash
git commit -m "Add new AI provider integration"
git commit -m "Fix dynamic variable replacement"
git commit -m "Improve Compare Lab layout"
git commit -m "Add prompt evaluation functionality"
git commit -m "Update project documentation"
```

## Step 4: Push Your Branch

```bash
git push origin feature/your-feature-name
```

## Step 5: Open a Pull Request

Visit your fork on GitHub and create a pull request targeting the original PromptPilot repository's main branch.

---

# 13. Pull Request Checklist

Before submitting a pull request, make sure that:

- [ ] Your changes address the intended issue or feature.
- [ ] Your code follows the project's coding standards.
- [ ] Existing functionality has not been unintentionally broken.
- [ ] Prompt creation and editing work correctly where applicable.
- [ ] Dynamic variables behave as expected.
- [ ] AI requests and responses are handled properly where applicable.
- [ ] API credentials remain secure.
- [ ] The interface remains responsive.
- [ ] Invalid inputs and errors are handled appropriately.
- [ ] No unnecessary files or dependencies were added.
- [ ] Documentation has been updated when necessary.
- [ ] Your commit messages are clear and descriptive.
- [ ] Screenshots are included for significant UI changes.

## Pull Request Description

A good pull request should explain:

**Summary:** What did you change?

**Purpose:** Why was the change necessary?

**Implementation:** How did you implement it?

**Testing:** What did you test?

**Screenshots:** Include before-and-after screenshots for visual changes when appropriate.

Keep pull requests focused. If you are proposing several unrelated changes, consider submitting separate pull requests.

---

# 14. Code of Conduct

All contributors are expected to maintain a respectful and collaborative environment.

Please:

- Be respectful when communicating with others.
- Provide constructive feedback.
- Respect different levels of experience.
- Avoid personal attacks or inappropriate language.
- Focus discussions on improving the project.
- Be open to suggestions and revisions.
- Respect the work and contributions of other developers.

Contributions should help make PromptPilot more reliable, accessible, and useful for its users.

---

# 📬 Thank You for Contributing!

Thank you for taking the time to contribute to PromptPilot.

Every improvement, whether a prompt management enhancement, an AI integration, a bug fix, a UI refinement, or a documentation update, helps make the project better.

**Together, we can make prompt engineering more organized, efficient, and accessible.**

---

*PromptPilot — Write better prompts. Test different models. Find what works.*