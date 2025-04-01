console.log("CareerSync: Content script injected ✅");

function isLikelyJobDescription(text) {
  return (
    text.length > 400 &&
    /(responsibilities|requirements|qualifications|experience|role)/i.test(text) &&
    !/(navigation|cookie|login|subscribe|footer)/i.test(text)
  );
}

function findJobDescription() {
  const elements = document.querySelectorAll('section, article, div');
  let bestMatch = '';
  let bestScore = 0;

  elements.forEach((el) => {
    const text = el.innerText?.trim();
    if (!text || text.length < 300) return;

    let score = 0;
    if (/responsibilities/i.test(text)) score += 2;
    if (/requirements|qualifications|skills|experience/i.test(text)) score += 2;
    if (text.length > 500) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = text;
    }
  });

  if (bestMatch) {
    console.log("CareerSync: Detected Job Description ✅");
    chrome.storage.local.set({ jobDescription: bestMatch.slice(0, 8000) });
  } else {
    console.log("CareerSync: No job description found ❌");
  }
}

findJobDescription();
