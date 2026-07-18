import re

with open('src/lib/pdfGenerator.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's see how they do malayalam rendering... usually for jsPDF without an advanced text shaper, it requires a pre-shaper like `indic-pdf` or something.
# The user noticed that "When I select the text from the pdf, the selected text has corrected spelling and looks different from the visible text"
# This confirms the exact strings I inputted are there, BUT visually they don't form the right glyphs due to lack of text shaping!
# Unfortunately, jsPDF doesn't natively do text shaping for indic languages.
# To fix the *visible text* looking wrong in jsPDF for Malayalam, we can use a library to pre-shape the string, or manually reshape. Or maybe they have `html2canvas` in their dependencies, let's check.
