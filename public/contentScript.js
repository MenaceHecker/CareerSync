console.log("CareerSync: Content script injected ✅");

/**
 * Site-specific selectors for common job posting websites
 */
const JOB_SITE_SELECTORS = {
  // Handshake
  'joinhandshake.com': [
    '[data-hook="job-description"]',
    '.job-description',
    '[data-testid="job-description"]',
    '.job-detail-content',
    '.job-posting-content',
    '.description-content'
  ],
  
  // LinkedIn
  'linkedin.com': [
    '.description__text',
    '.jobs-description-content__text',
    '.jobs-box__html-content',
    '.jobs-description__container'
  ],
  
  // Indeed
  'indeed.com': [
    '.jobsearch-jobDescriptionText',
    '#jobDescriptionText',
    '.jobsearch-JobComponent-description'
  ],
  
  // Glassdoor
  'glassdoor.com': [
    '.jobDescriptionContent',
    '[data-test="job-description"]',
    '.desc'
  ],
  
  // AngelList/Wellfound
  'angel.co': [
    '.job-description',
    '[data-cy="job-description"]'
  ],
  
  // Lever
  'lever.co': [
    '.section-wrapper .content',
    '.posting-requirements',
    '.posting-description'
  ],
  
  // Greenhouse
  'greenhouse.io': [
    '#content',
    '.application-detail'
  ],

  // ZipRecruiter
  'ziprecruiter.com': [
    '.jobDescriptionSection',
    '.job-description'
  ],

  // Monster
  'monster.com': [
    '.job-description',
    '[data-testid="svx-job-description-text"]'
  ],

  // CareerBuilder
  'careerbuilder.com': [
    '.job-text',
    '.data-details'
  ]
};

/**
 * Generic selectors to try if site-specific ones don't work
 */
const GENERIC_JOB_SELECTORS = [
  '[data-testid*="job-description"]',
  '[data-hook*="job-description"]',
  '[class*="job-description"]',
  '[class*="jobDescription"]',
  '[class*="job_description"]',
  '[id*="job-description"]',
  '[id*="jobDescription"]',
  '.description',
  '.job-detail',
  '.job-content',
  '.posting-content',
  '.position-description',
  '.role-description',
  'section[data-testid*="description"]',
  'div[data-testid*="description"]'
];

/**
 * Keywords that indicate job description content
 */
const JOB_DESCRIPTION_KEYWORDS = [
  'responsibilities', 'requirements', 'qualifications', 'experience', 
  'role', 'position', 'duties', 'skills', 'about the role',
  'what you\'ll do', 'key responsibilities', 'required qualifications',
  'preferred qualifications', 'job description', 'we are looking for',
  'the ideal candidate', 'benefits', 'compensation', 'salary'
];

/**
 * Keywords that indicate content should be excluded
 */
const EXCLUDE_KEYWORDS = [
  'navigation', 'cookie', 'login', 'subscribe', 'footer', 'header',
  'sidebar', 'advertisement', 'related jobs', 'similar jobs',
  'recommended jobs', 'apply now', 'sign up', 'create account',
  'privacy policy', 'terms of service', 'company reviews'
];

/**
 * Get the current site's domain
 */
function getCurrentDomain() {
  return window.location.hostname.toLowerCase();
}

/**
 * Get site-specific selectors for the current domain
 */
function getSiteSelectors() {
  const domain = getCurrentDomain();
  
  // Check for exact matches first
  for (const [siteDomain, selectors] of Object.entries(JOB_SITE_SELECTORS)) {
    if (domain.includes(siteDomain)) {
      return selectors;
    }
  }
  
  return GENERIC_JOB_SELECTORS;
}

/**
 * Calculate job description score based on content analysis
 */
function calculateJobDescriptionScore(text) {
  if (!text || text.length < 200) return 0;
  
  let score = 0;
  const lowerText = text.toLowerCase();
  
  // Length scoring
  if (text.length > 500) score += 2;
  if (text.length > 1000) score += 1;
  if (text.length > 2000) score += 1;
  
  // Keyword scoring
  JOB_DESCRIPTION_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += keyword.length > 10 ? 3 : 2; // Longer phrases get more points
    }
  });
  
  // Penalty for excluded content
  EXCLUDE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score -= 2;
    }
  });
  
  // Structure scoring (paragraphs, lists, etc.)
  const paragraphs = text.split('\n').filter(p => p.trim().length > 50);
  if (paragraphs.length >= 3) score += 2;
  if (paragraphs.length >= 5) score += 1;
  
  // Bullet points or numbered lists
  if (/[•\-\*]\s/.test(text) || /\d+\.\s/.test(text)) score += 2;
  
  return Math.max(0, score);
}

/**
 * Clean and normalize extracted text
 */
function cleanJobDescriptionText(text) {
  if (!text) return '';
  
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove common UI elements
    .replace(/Apply Now|Save Job|Share|Print/gi, '')
    // Remove email addresses and phone numbers that might be noise
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '')
    // Clean up multiple line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Extract job description using site-specific and generic strategies
 */
function findJobDescription() {
  console.log(`CareerSync: Analyzing ${getCurrentDomain()} for job description`);
  
  const selectors = getSiteSelectors();
  let bestMatch = '';
  let bestScore = 0;
  let elementSource = 'unknown';
  
  // Try site-specific selectors first
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (!element || !element.innerText) continue;
        
        const text = cleanJobDescriptionText(element.innerText);
        const score = calculateJobDescriptionScore(text);
        
        console.log(`CareerSync: Selector "${selector}" - Score: ${score}, Length: ${text.length}`);
        
        if (score > bestScore && text.length > 200) {
          bestScore = score;
          bestMatch = text;
          elementSource = selector;
        }
      }
    } catch (error) {
      console.log(`CareerSync: Error with selector "${selector}":`, error);
    }
  }
  
  // Fallback: analyze all sections, articles, and divs
  if (bestScore < 5) {
    console.log("CareerSync: Trying fallback analysis...");
    
    const elements = document.querySelectorAll('section, article, div, main');
    
    for (const element of elements) {
      if (!element || !element.innerText) continue;
      
      const text = cleanJobDescriptionText(element.innerText);
      if (text.length < 300 || text.length > 10000) continue; // Skip very short or very long content
      
      const score = calculateJobDescriptionScore(text);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = text;
        elementSource = `fallback-${element.tagName.toLowerCase()}`;
      }
    }
  }
  
  // Final validation
  if (bestMatch && bestScore >= 3) {
    console.log(`CareerSync: Found job description! Source: ${elementSource}, Score: ${bestScore}, Length: ${bestMatch.length}`);
    
    // Truncate if too long (keep first 8000 characters)
    const finalText = bestMatch.length > 8000 ? bestMatch.slice(0, 8000) + '...' : bestMatch;
    
    chrome.storage.local.set({ 
      jobDescription: finalText,
      extractionMeta: {
        domain: getCurrentDomain(),
        selector: elementSource,
        score: bestScore,
        timestamp: Date.now()
      }
    });
    
    return finalText;
  } else {
    console.log(`CareerSync: No suitable job description found. Best score: ${bestScore}`);
    return null;
  }
}

/**
 * Enhanced H1B sponsorship search with better error handling
 */
async function searchH1BSponsorship(companyName) {
  const searchQuery = `"${companyName}" H1B visa sponsorship`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

  try {
    const response = await fetch(googleSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    let sponsorsH1B = false;
    let details = "No clear indication found in search snippets.";
    
    const positiveKeywords = [
      'h1b sponsor', 'h-1b sponsor', 'h1b visa sponsored', 'h-1b visa sponsored',
      'sponsors h1b', 'sponsors h-1b', 'h1b friendly', 'h-1b friendly',
      'h1b employer', 'h-1b employer', 'sponsorship available', 'h1b data',
      'will sponsor', 'provides sponsorship', 'offers h1b'
    ];
    
    const negativeKeywords = [
      'does not sponsor h1b', 'no h1b sponsorship', 'not offer h1b',
      'unable to sponsor', 'do not sponsor work visa', 'no visa sponsorship',
      'us citizens only', 'no sponsorship available'
    ];
    
    const lowerCaseHtml = html.toLowerCase();
    
    // Check positive keywords
    for (const keyword of positiveKeywords) {
      if (lowerCaseHtml.includes(keyword)) {
        sponsorsH1B = true;
        details = `Found positive indicator: "${keyword}"`;
        break;
      }
    }

    // Check negative keywords (override positive if found)
    if (!sponsorsH1B) {
      for (const keyword of negativeKeywords) {
        if (lowerCaseHtml.includes(keyword)) {
          details = `Found negative indicator: "${keyword}"`;
          break; 
        }
      }
    }

    return { 
      company: companyName, 
      sponsorsH1B: sponsorsH1B, 
      details: details,
      searchQuery: searchQuery
    };

  } catch (error) {
    console.error("Error searching for H1B sponsorship:", error);
    return { 
      company: companyName, 
      sponsorsH1B: false, 
      error: error.message,
      details: "Error occurred during search"
    };
  }
}

// Run job description extraction when page loads
document.addEventListener('DOMContentLoaded', findJobDescription);

// Also run after a short delay to catch dynamically loaded content
setTimeout(findJobDescription, 2000);

// Re-run if URL changes (for SPAs)
let currentUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    setTimeout(findJobDescription, 1000);
  }
}, 1000);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractJobDescription") {
    const result = findJobDescription();
    sendResponse({ success: true, jobDescription: result });
    return true;
  }
  
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