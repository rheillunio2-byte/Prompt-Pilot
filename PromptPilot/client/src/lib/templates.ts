export type Template = { id: string; title: string; category: string; summary: string; body: string; tags: string[] };

export const TEMPLATE_CATEGORIES = ["Writing", "Programming", "Research", "Education", "Marketing", "Business", "Productivity"];

export const TEMPLATES: Template[] = [
  { id: "w-improve", category: "Writing", title: "Improve a draft", summary: "Tighten wording without changing the meaning.", tags: ["editing"],
    body: "Improve the following {{content_type}}. Keep the original meaning and a natural {{tone}} tone. Remove filler, fix grammar, and keep my structure unless it hurts clarity.\n\nDraft:\n{{draft}}\n\nReturn the improved version, then list the three most important changes you made." },
  { id: "w-outline", category: "Writing", title: "Article outline", summary: "A structured outline for a piece aimed at a specific reader.", tags: ["planning"],
    body: "Create an outline for an article about {{topic}} for {{audience}}.\n\nInclude a working title, a one-sentence thesis, 4–6 sections with a key point each, and the strongest example or evidence to use in each section." },
  { id: "p-explain", category: "Programming", title: "Code explainer", summary: "Plain-language explanation of code or a concept.", tags: ["learning"],
    body: "Explain {{code_or_concept}} in beginner-friendly language.\n\nStructure the answer as:\n1. What it does in one sentence\n2. A short example\n3. Common mistakes to avoid" },
  { id: "p-review", category: "Programming", title: "Code review", summary: "Find bugs, explain causes, propose a fix.", tags: ["review"],
    body: "Review this {{language}} code. Identify bugs and risky patterns, explain why each happens, and suggest a corrected version.\n\nCode:\n{{code}}\n\nOrder findings from most to least severe." },
  { id: "r-assistant", category: "Research", title: "Research assistant", summary: "Separate established facts from open questions.", tags: ["analysis"],
    body: "Help me structure a study about {{topic}}.\n\nSeparate established facts from hypotheses, list open questions, and suggest the kinds of sources that would verify each claim. Flag anything you are unsure about." },
  { id: "r-summary", category: "Research", title: "Source summary", summary: "Summarize a text with its limits made explicit.", tags: ["summarizing"],
    body: "Summarize the following text for {{audience}} in {{length}}.\n\nText:\n{{text}}\n\nAfter the summary, list claims that need independent verification and anything the text leaves out." },
  { id: "e-tutor", category: "Education", title: "Study companion", summary: "Step-by-step teaching with check-in questions.", tags: ["tutoring"],
    body: "Teach me {{topic}} step by step. I am at a {{level}} level.\n\nAfter each section, ask one quick question to check my understanding and wait for my answer before continuing." },
  { id: "e-quiz", category: "Education", title: "Quiz generator", summary: "Practice questions with explanations.", tags: ["assessment"],
    body: "Write {{count}} multiple-choice questions about {{topic}} at a {{level}} level.\n\nFor each question give four options, mark the correct one, and explain in one or two sentences why the others are wrong." },
  { id: "m-campaign", category: "Marketing", title: "Content plan", summary: "Themes, formats and a realistic cadence.", tags: ["planning"],
    body: "Create a content plan for {{audience}} about {{subject}}.\n\nInclude 3–4 recurring themes, the best format for each, and a realistic publishing cadence for a team of {{team_size}}." },
  { id: "m-copy", category: "Marketing", title: "Landing page copy", summary: "Headline, subhead and benefit-led sections.", tags: ["copywriting"],
    body: "Write landing page copy for {{product}}, aimed at {{audience}}.\n\nProvide three headline options, a subheadline, three benefit sections with proof points, and a closing call to action. Tone: {{tone}}." },
  { id: "b-brief", category: "Business", title: "Decision memo", summary: "Options, trade-offs and a recommendation.", tags: ["strategy"],
    body: "Write a one-page decision memo on {{decision}}.\n\nSet out the context, 2–3 options with costs and risks, a recommendation, and what would change your mind. Audience: {{audience}}." },
  { id: "b-email", category: "Business", title: "Professional email", summary: "A clear email with one specific ask.", tags: ["communication"],
    body: "Draft an email to {{recipient}} about {{topic}}.\n\nThe single thing I need from them is {{ask}}. Keep it under {{word_limit}} words, state the ask in the first two sentences, and end with a clear next step." },
  { id: "pr-plan", category: "Productivity", title: "Weekly planner", summary: "Turn a task list into a realistic week.", tags: ["planning"],
    body: "Here are my tasks and constraints for the week:\n{{tasks}}\n\nBuild a realistic plan with no more than {{hours_per_day}} focused hours per day. Put the hardest work first, leave buffer time, and tell me what to drop if the week runs over." },
  { id: "pr-meeting", category: "Productivity", title: "Meeting notes to actions", summary: "Decisions, owners and deadlines from raw notes.", tags: ["meetings"],
    body: "Turn these meeting notes into a summary.\n\nNotes:\n{{notes}}\n\nList decisions made, action items with an owner and deadline (write \"unassigned\" if missing), and open questions." }
];
