#!/usr/bin/env node
/**
 * Add URLs section to all contentLabels.json files in collections
 */

const fs = require('fs');
const path = require('path');

const urlsSection = {
  "urls": {
    "resume": {
      "download": "https://static-api-opal.vercel.app/resume/resume.pdf",
      "view": "https://static-api-opal.vercel.app/resume/resume.pdf"
    },
    "social": {
      "linkedin": "https://linkedin.com/in/kuhandran-samudrapandiyan",
      "email": "mailto:skuhandran@yahoo.com"
    }
  }
};

const locales = ['ar-AE', 'de', 'en', 'es', 'fr', 'hi', 'id', 'my', 'si', 'ta', 'th'];

locales.forEach(locale => {
  const filePath = path.join(__dirname, `../public/collections/${locale}/data/contentLabels.json`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${locale}: File not found`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Check if URLs section already exists
    if (data.urls) {
      console.log(`✅ ${locale}: URLs section already exists`);
      return;
    }

    // Add URLs section at the beginning
    const newData = {
      ...urlsSection,
      ...data
    };

    // Also update the about.cta section if it exists
    if (newData.about && newData.about.cta) {
      newData.about.cta = {
        ...newData.about.cta,
        "resumeUrl": urlsSection.urls.resume.download,
        "linkedinUrl": urlsSection.urls.social.linkedin
      };
    }

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log(`✅ ${locale}: URLs section added successfully`);

  } catch (error) {
    console.error(`❌ ${locale}: Error - ${error.message}`);
  }
});

console.log('\n✅ All contentLabels.json files updated with URLs section');
