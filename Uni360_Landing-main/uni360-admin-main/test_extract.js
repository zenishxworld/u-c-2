const val = `{
"success": true,
"generatedLor": "To Whom It May Concern,\\n\\nI am writing this letter in support of Prisha Patel, of field Computer Science, whom I have known for some time in an academic and mentoring capacity at Technical University Of Munich, located in Munich, Germany. During this period, I have had multiple opportunities to interact with the student closely and observe their approach to learning, responsibility, and professional conduct. Based on these experiences, I am pleased to share my perspective on their suitability for further academic or professional opportunities.\\n\\nFrom my experience, Prisha Patel has demonstrated a sound understanding of their field of study and a practical approach toward applying theoretical concepts. They are comfortable working across different aspects of their domain and show the ability to connect individual components into a cohesive outcome. I have observed them handling assigned work with care and patience and being particularly strong in Python, ML, AI, especially when faced with challenges that required additional effort or revision. Rather than looking for quick solutions, they showed a willingness to work through problems and improve the quality of their output.\\n\\nWhat I have personally appreciated is the student's attitude toward learning. They tend to ask relevant questions and try to understand the reasoning behind decisions instead of merely following instructions. Feedback is taken positively, and I have noticed visible improvement in their work after suggestions were provided. They manage their time responsibly and can be relied upon to meet expectations without the need for constant supervision. In group settings, they are cooperative and communicate clearly, while also being capable of working independently when required.\\n\\nOn a personal level, Prisha Patel maintains a respectful and professional demeanor. They approach responsibilities with sincerity and remain focused even when dealing with unfamiliar or demanding tasks. In my opinion, this consistency and willingness to learn are qualities that contribute significantly to long-term growth, regardless of the specific role or academic path they choose.\\n\\nBased on my experience working with them, I believe they have a solid foundation and the right mindset to succeed in future academic or professional environments. They show dedication toward their work and a genuine interest in continuous improvement. I am confident that they will make good use of the opportunities presented to them and carry out their responsibilities with seriousness and commitment.\\n\\nSincerely,\\nProf. Kusum Lata"
}`;

function extractText(val) {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.length > 10) {
      try {
        const parsed = JSON.parse(trimmed);
        const inner = extractText(parsed);
        if (inner) return inner;
      } catch (err) { /* not valid JSON, fall through */ }
    }
    if (trimmed.length > 20) return trimmed;
  }
  if (val && typeof val === "object") {
    const preferred = [
      "generatedLor", "generatedlor", "lor",
      "generatedSop", "generatedsop", "sop", "statementOfPurpose",
      "generatedCoverLetter", "generatedcoverletter", "coverLetter", "cover_letter",
      "content", "generatedContent", "text", "generatedText",
      "result", "output", "letter", "document", "body", "message",
    ];
    for (const k of preferred) {
      const found = extractText(val[k]);
      if (found) return found;
    }
    for (const k of Object.keys(val)) {
      const v = val[k];
      if (typeof v === "boolean" || typeof v === "number") continue;
      const found = extractText(v);
      if (found) return found;
    }
  }
  return null;
}

console.log(extractText(val));
