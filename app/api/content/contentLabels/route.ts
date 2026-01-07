import { NextResponse } from 'next/server'

// Pre-loaded contentLabels data
const contentLabels = {
  "urls": {
    "resume": {
      "download": "https://static-api-opal.vercel.app/resume/resume.pdf",
      "view": "https://static-api-opal.vercel.app/resume/resume.pdf"
    },
    "social": {
      "linkedin": "https://linkedin.com/in/kuhandran-samudrapandiyan",
      "email": "mailto:skuhandran@yahoo.com"
    }
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "skills": "Skills",
    "experience": "Experience",
    "projects": "Projects",
    "achievements": "Achievements",
    "education": "Education",
    "contact": "Contact"
  },
  "hero": {
    "greeting": "Hi, I'm Kuhandran",
    "badge": "Hi, I'm Kuhandran",
    "mainHeading": "Technical Leader Driving Digital Transformation",
    "roles": {
      "primary": "Technical Delivery Manager",
      "secondary": "Full-Stack Engineer",
      "tertiary": "Data Enthusiast"
    },
    "description": "Specialized in enterprise applications, React Native development, and data visualization. Combining 8+ years of technical expertise with strategic business insights to drive operational efficiency and innovation.",
    "highlights": {
      "experience": "8+ Years Experience",
      "location": "Based in Malaysia",
      "relocation": "Open to Relocation"
    },
    "cta": {
      "primary": "View My Work",
      "secondary": "Let's Connect"
    },
    "stats": {
      "experience": {
        "value": "8+",
        "label": "Years Experience"
      },
      "efficiency": {
        "value": "15%",
        "label": "Efficiency Gains"
      },
      "countries": {
        "value": "2",
        "label": "Countries"
      },
      "education": {
        "value": "MBA",
        "label": "Business Analytics"
      }
    },
    "scroll": {
      "text": "Scroll Down",
      "ariaLabel": "Scroll to about section"
    }
  },
  "about": {
    "subtitle": "Who I Am",
    "title": "Bridging Technology & Business Strategy",
    "description": "Technical leader with a passion for building scalable solutions",
    "image": {
      "src": "/image/profile.png",
      "alt": "Kuhandran SamudraPandiyan"
    },
    "stats": [
      {
        "icon": "Users",
        "value": "8+",
        "label": "Years Experience"
      },
      {
        "icon": "Briefcase",
        "value": "2",
        "label": "Countries"
      },
      {
        "icon": "TrendingUp",
        "value": "15%",
        "label": "Efficiency Gains"
      }
    ],
    "paragraphs": {
      "current_role": "Currently serving as a Technical Project Manager at FWD Insurance, I lead cross-border delivery teams and drive continuous improvement initiatives that have reduced aging incident tickets by 15%. My role combines technical architecture, system analysis, and strategic project management.",
      "previous_experience": "With over 6 years at Maybank, I progressed from Junior Developer to Senior Software Engineer, building React.js applications, implementing RESTful APIs, and optimizing user experiences that improved load speeds by 15%.",
      "education": "I hold an MBA in Business Analytics from Cardiff Metropolitan University, which allows me to bridge technical expertise with strategic business insights—a unique combination that drives innovation in enterprise environments."
    },
    "highlights": {
      "heading": "Key Highlights",
      "items": [
        "Cross-border team management & Agile methodologies",
        "Full-stack development: React, React Native, Spring Boot",
        "Data visualization & analytics with Power BI",
        "AWS certified developer with cloud expertise",
        "Domain experience: Banking & Insurance sectors",
        "Sri Lankan with EP in Malaysia - Open to relocation"
      ]
    },
    "cta": {
      "resume": "Download Resume",
      "linkedin": "View LinkedIn",
      "resumeUrl": "https://static-api-opal.vercel.app/resume/resume.pdf",
      "linkedinUrl": "https://linkedin.com/in/kuhandran-samudrapandiyan"
    }
  },
  "skills": {
    "subtitle": "Skills & Expertise",
    "title": "Technical Proficiency",
    "description": "Full-stack capabilities with expertise across modern technologies"
  },
  "projects": {
    "subtitle": "Portfolio",
    "title": "Featured Projects",
    "description": "Showcasing impactful solutions across enterprise applications",
    "empty": "No projects found"
  },
  "experience": {
    "subtitle": "Career Journey",
    "title": "Professional Experience",
    "description": "A track record of driving innovation and delivering results",
    "empty": "No experience entries found"
  },
  "achievements": {
    "subtitle": "Recognition",
    "title": "Awards & Achievements",
    "description": "Milestones and recognitions throughout my career",
    "empty": "No achievements found"
  },
  "education": {
    "subtitle": "Academic Background",
    "title": "Education",
    "description": "Formal education and continuous learning journey",
    "empty": "No education entries found"
  },
  "contact": {
    "subtitle": "Get In Touch",
    "title": "Let's Work Together",
    "description": "Open to new opportunities and collaborations"
  },
  "chatbot": {
    "subtitle": "AI Assistant",
    "title": "Chat with Me",
    "description": "Ask me anything about my experience, skills, or projects",
    "placeholder": "Type your message...",
    "initialMessage": "Hi! I'm Kuhandran's AI assistant. Ask me anything about his experience, skills, or projects!"
  },
  "buttons": {
    "viewMore": "View More",
    "learnMore": "Learn More",
    "download": "Download",
    "sendMessage": "Send Message"
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "noData": "No data available"
  }
}

export async function GET() {
  return NextResponse.json(contentLabels, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
