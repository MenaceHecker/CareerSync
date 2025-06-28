console.log("CareerSync: Content script injected ✅");

/**
 * Checks if a given text is likely a job description based on length and keywords.
 * @param {string} text - The text content to check.
 * @returns {boolean} - True if likely a job description, false otherwise.
 */
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
    console.log("CareerSync: Detected Job Description ");
    chrome.storage.local.set({ jobDescription: bestMatch.slice(0, 8000) });
  } else {
    console.log("CareerSync: No job description found ");
  }
}

/**
 * Initiates an H1B sponsorship search for a given company name by performing a Google search.
 * It constructs a Google search URL and then fetches the HTML content of the search results.
 * The function then scans this HTML for predefined positive or negative keywords to determine
 * potential H1B sponsorship status.
 * @param {string} companyName - The name of the company to search for.
 * @returns {Promise<object>} - A promise that resolves to an object containing the company name,
 * a boolean indicating likely sponsorship, and details about the finding.
 * In case of an error, it resolves with an error property.
 */
async function searchH1BSponsorship(companyName) {
  const searchQuery = `${companyName} H1B visa sponsorship`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

  try {
    const response = await fetch(googleSearchUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    let sponsorsH1B = false;
    let details = "No clear indication found in search snippets.";
    const positiveKeywords = [
      'h1b sponsor', 'h-1b sponsor', 'h1b visa sponsored', 'h-1b visa sponsored',
      'sponsors h1b', 'sponsors h-1b', 'h1b friendly', 'h-1b friendly',
      'h1b employer', 'h-1b employer', 'sponsorship available', 'h1b data'
    ];
    const negativeKeywords = [
      'does not sponsor h1b', 'no h1b sponsorship', 'not offer h1b',
      'unable to sponsor', 'do not sponsor work visa'
    ];
    const lowerCaseHtml = html.toLowerCase();
//checking positive keywords here
    for (const keyword of positiveKeywords) {
      if (lowerCaseHtml.includes(keyword)) {
        sponsorsH1B = true;
        details = "Keywords indicating sponsorship found in search results.";
        break;
      }
    }

//negative keywords here
    if (!sponsorsH1B) {
      for (const keyword of negativeKeywords) {
        if (lowerCaseHtml.includes(keyword)) {
          details = "Keywords indicating no sponsorship found in search results.";
          break; 
        }
      }
    }

    // Return the result object
    return { company: companyName, sponsorsH1B: sponsorsH1B, details: details };

  } catch (error) {
    console.error("Error searching for H1B sponsorship:", error);
    return { company: companyName, sponsorsH1B: false, error: error.message };
  }
}

findJobDescription();


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "searchH1B") {
    if (request.companyName) {
      searchH1BSponsorship(request.companyName)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true;
    } else {
      sendResponse({ error: "Company name not provided for H1B search." });
      return false;
    }
  }
});