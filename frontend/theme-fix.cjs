const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'src');

const replacements = [
  // Backgrounds & Surfaces
  { regex: /background:\s*#F8FAFC\b/gi, replacement: 'background: var(--background)' },
  { regex: /background-color:\s*#F8FAFC\b/gi, replacement: 'background-color: var(--background)' },
  { regex: /background:\s*#FFFFFF\b/gi, replacement: 'background: var(--card)' },
  { regex: /background-color:\s*#FFFFFF\b/gi, replacement: 'background-color: var(--card)' },
  { regex: /background-color:\s*#0f172a\b/gi, replacement: 'background-color: var(--background)' },

  // Borders
  { regex: /border:\s*1px\s+solid\s+#E5E7EB\b/gi, replacement: 'border: 1px solid var(--border)' },
  { regex: /border:\s*1px\s+solid\s+#334155\b/gi, replacement: 'border: 1px solid var(--border)' },
  { regex: /border-color:\s*#E5E7EB\b/gi, replacement: 'border-color: var(--border)' },
  { regex: /border-color:\s*#334155\b/gi, replacement: 'border-color: var(--border)' },
  { regex: /border-color:\s*#e2e8f0\b/gi, replacement: 'border-color: var(--border)' },
  { regex: /border-color:\s*#b0bac9\b/gi, replacement: 'border-color: var(--border)' },

  // Text Primary (very dark grays / black)
  { regex: /color:\s*#111827\b/gi, replacement: 'color: var(--text-primary)' },
  { regex: /color:\s*#0f172a\b/gi, replacement: 'color: var(--text-primary)' },
  { regex: /color:\s*#172033\b/gi, replacement: 'color: var(--text-primary)' },
  { regex: /color:\s*#000000\b/gi, replacement: 'color: var(--text-primary)' },
  { regex: /color:\s*#f8fafc\b/gi, replacement: 'color: var(--text-primary)' },
  { regex: /color:\s*#ffffff\b/gi, replacement: 'color: var(--text-inverse)' },

  // Text Secondary (medium grays)
  { regex: /color:\s*#374151\b/gi, replacement: 'color: var(--text-secondary)' },
  { regex: /color:\s*#4b5563\b/gi, replacement: 'color: var(--text-secondary)' },
  { regex: /color:\s*#475569\b/gi, replacement: 'color: var(--text-secondary)' },
  { regex: /color:\s*#344054\b/gi, replacement: 'color: var(--text-secondary)' },
  { regex: /color:\s*#cbd5e1\b/gi, replacement: 'color: var(--text-secondary)' },
  
  // Text Muted (lighter grays)
  { regex: /color:\s*#6B7280\b/gi, replacement: 'color: var(--text-muted)' },
  { regex: /color:\s*#9ca3af\b/gi, replacement: 'color: var(--text-muted)' },
  { regex: /color:\s*#64748b\b/gi, replacement: 'color: var(--text-muted)' },
  { regex: /color:\s*#8a94a6\b/gi, replacement: 'color: var(--text-muted)' },
  { regex: /color:\s*#6b7587\b/gi, replacement: 'color: var(--text-muted)' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.css') && !fullPath.includes('node_modules')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      replacements.forEach(r => {
        content = content.replace(r.regex, r.replacement);
      });
      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(cssDir);
console.log('CSS color contrast updates completed.');
