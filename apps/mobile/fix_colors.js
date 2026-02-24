const fs = require('fs');

let fileContent = fs.readFileSync('src/components/domain/matching/MatchScreen.tsx', 'utf-8');

fileContent = fileContent.replace(/<ThemedText style=\{styles\.hingePromptQ\}>/g, '<ThemedText style={[styles.hingePromptQ, { color: colors.text.primary }]}>');
fileContent = fileContent.replace(/<ThemedText style=\{styles\.hingePromptA\}>/g, '<ThemedText style={[styles.hingePromptA, { color: colors.text.primary }]}>');
fileContent = fileContent.replace(/<ThemedText style=\{styles\.hingeTraitText\}>/g, '<ThemedText style={[styles.hingeTraitText, { color: colors.text.primary }]}>');

// for the ones that already have arrays:
// <ThemedText style={[styles.hingePromptA, { fontWeight: "500", fontStyle: "normal" }]} >
fileContent = fileContent.replace(
    /style=\{\[\s*styles\.hingePromptA,\s*\{\s*fontWeight:\s*"500",\s*fontStyle:\s*"normal"\s*\}\s*,?\s*\]\}/g,
    'style={[styles.hingePromptA, { color: colors.text.primary, fontWeight: "500", fontStyle: "normal" }]}'
);

// and hingeName:
fileContent = fileContent.replace(/<ThemedText style=\{styles\.hingeName\}>/g, '<ThemedText style={[styles.hingeName, { color: colors.text.primary }]}>');
fileContent = fileContent.replace(/<ThemedText style=\{styles\.hingeLocationText\}>/g, '<ThemedText style={[styles.hingeLocationText, { color: colors.text.primary }]}>');


fs.writeFileSync('src/components/domain/matching/MatchScreen.tsx', fileContent);

