const fs = require('fs');
const content = fs.readFileSync('src/components/domain/matching/MatchScreen.tsx', 'utf-8');

// The block to extract starts from <View style={styles.photoContainer}> inside renderSwipeTab
// until the end of the <View style={[styles.cardDetails... }> block.
// This is bounded between `<View style={styles.photoContainer}>` and `<View style={{ height: 160 }} />`

const extractStart = content.indexOf('{/* Dynamic Photos View - Bumble style */}');
const extractEnd = content.indexOf('<View style={{ height: 160 }} />');

let profileContentBlock = content.substring(extractStart, extractEnd);

// Replace currentCandidate with `profile` param
profileContentBlock = profileContentBlock.replace(/currentCandidate/g, 'profile');

const renderFn = `
    const renderProfileContent = (profile: any) => {
        return (
            <React.Fragment>
                ${profileContentBlock}
                <View style={{ height: 160 }} />
            </React.Fragment>
        );
    };
`;

// Insert the renderFn right before `const renderLikesTab`
const renderLikesTabIdx = content.indexOf('const renderLikesTab = () => {');
let newContent = content.slice(0, renderLikesTabIdx) + renderFn + '\n    ' + content.slice(renderLikesTabIdx);

// Now update the renderSwipeTab block inside <ScrollView>
const swipeTabStart = newContent.indexOf('{/* Dynamic Photos View - Bumble style */}');
const swipeTabEnd = newContent.indexOf('<View style={{ height: 160 }} />', swipeTabStart) + '<View style={{ height: 160 }} />'.length;

newContent = newContent.slice(0, swipeTabStart) + '{renderProfileContent(currentCandidate)}' + newContent.slice(swipeTabEnd);

// Now update the Modal block
const modalStartStr = '<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>';
const modalStart = newContent.indexOf(modalStartStr);
const modalEndStr = '</ScrollView>';
const modalEnd = newContent.indexOf(modalEndStr, modalStart);

newContent = newContent.slice(0, modalStart + modalStartStr.length) + '\n                            {renderProfileContent(selectedLike)}\n                        ' + newContent.slice(modalEnd);

fs.writeFileSync('src/components/domain/matching/MatchScreen.tsx', newContent);
console.log('Match UI fixed seamlessly.');
