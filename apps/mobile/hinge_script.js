const fs = require('fs');

let fileContent = fs.readFileSync('src/components/domain/matching/MatchScreen.tsx', 'utf-8');

// 1. Replace renderProfileContent entirely
const renderProfileStart = fileContent.indexOf('const renderProfileContent = (profile: any) => {');
const renderProfileEnd = fileContent.indexOf('const renderLikesTab = () => {');

const newRenderProfile = `
  const renderProfileContent = (profile: any) => {
    if (!profile) return null;
    const photos = profile.photo_urls || profile.photos || [profile.photo];
    const display_name = profile.display_name || profile.name;

    const cardStyle = [
      styles.hingeCard,
      {
        backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
        borderColor: isDark ? "rgba(29, 185, 84, 0.25)" : "rgba(29, 185, 84, 0.35)",
      },
    ];

    return (
      <View style={styles.hingeContainer}>
        {/* Header Name */}
        <View style={styles.hingeHeader}>
          <ThemedText style={styles.hingeName}>
            {display_name}, {profile.age}
          </ThemedText>
          {(profile.active_place_name || profile.location) && (
            <View style={styles.hingeLocationRow}>
              <IconSymbol name="mappin.and.ellipse" size={14} color={ACCENT} />
              <ThemedText style={styles.hingeLocationText}>
                {profile.active_place_name || profile.location}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Photo 1 */}
        {photos.length > 0 && photos[0] && (
          <View style={cardStyle}>
            <Image source={{ uri: photos[0] }} style={styles.hingeImage} />
          </View>
        )}

        {/* Badges / Traits (education, height, smoking, star_sign) */}
        {(profile.height ||
          profile.education ||
          profile.smoking ||
          profile.star_sign ||
          profile.about) && (
          <View style={[cardStyle, styles.hingePadding]}>
            {profile.height && (
              <View style={styles.hingeTraitRow}>
                <IconSymbol name="ruler.fill" size={16} color={colors.text.primary} />
                <ThemedText style={styles.hingeTraitText}>
                  {profile.height} cm
                </ThemedText>
              </View>
            )}
            {profile.education && (
              <View style={styles.hingeTraitRow}>
                <IconSymbol name="graduationcap.fill" size={16} color={colors.text.primary} />
                <ThemedText style={styles.hingeTraitText}>
                  {profile.education}
                </ThemedText>
              </View>
            )}
            {profile.smoking && (
              <View style={styles.hingeTraitRow}>
                <IconSymbol name="smoke.fill" size={16} color={colors.text.primary} />
                <ThemedText style={styles.hingeTraitText}>
                  {profile.smoking}
                </ThemedText>
              </View>
            )}
            {profile.star_sign && (
              <View style={styles.hingeTraitRow}>
                <IconSymbol name="star.fill" size={16} color={colors.text.primary} />
                <ThemedText style={styles.hingeTraitText}>
                  {profile.star_sign}
                </ThemedText>
              </View>
            )}
            {profile.about?.map((item: any, idx: number) => (
              <View key={\`about-\${idx}\`} style={styles.hingeTraitRow}>
                <IconSymbol name={item.icon || "person.fill"} size={16} color={colors.text.primary} />
                <ThemedText style={styles.hingeTraitText}>{item.text}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Prompt 1 */}
        {profile.prompts?.length > 0 && (
          <View style={[cardStyle, styles.hingePadding]}>
            <ThemedText style={styles.hingePromptQ}>{profile.prompts[0].question}</ThemedText>
            <ThemedText style={styles.hingePromptA}>{profile.prompts[0].answer}</ThemedText>
          </View>
        )}

        {/* Legacy Prompt alternative if empty array */}
        {!profile.prompts?.length && profile.prompt && (
          <View style={[cardStyle, styles.hingePadding]}>
            <ThemedText style={styles.hingePromptQ}>{profile.prompt.q}</ThemedText>
            <ThemedText style={styles.hingePromptA}>{profile.prompt.a}</ThemedText>
          </View>
        )}

        {/* Bio / About section */}
        {profile.bio && (
          <View style={[cardStyle, styles.hingePadding]}>
            <ThemedText style={styles.hingePromptQ}>Hakkımda:</ThemedText>
            <ThemedText style={[styles.hingePromptA, { fontWeight: '500', fontStyle: 'normal' }]}>{profile.bio}</ThemedText>
          </View>
        )}

        {/* Photo 2 */}
        {photos.length > 1 && photos[1] && (
           <View style={cardStyle}>
            <Image source={{ uri: photos[1] }} style={styles.hingeImage} />
          </View>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <View style={[cardStyle, styles.hingePadding]}>
            {profile.interests.map((interest: any, idx: number) => {
              const text = typeof interest === 'string' ? interest : interest.text;
              const icon = typeof interest === 'string' ? "star.fill" : interest.icon;
              return (
                <View key={\`int-\${idx}\`} style={styles.hingeTraitRow}>
                  <IconSymbol name={icon as any} size={16} color={colors.text.primary} />
                  <ThemedText style={styles.hingeTraitText}>{text}</ThemedText>
                </View>
              );
            })}
          </View>
        )}

        {/* Photo 3 */}
        {photos.length > 2 && photos[2] && (
          <View style={cardStyle}>
            <Image source={{ uri: photos[2] }} style={styles.hingeImage} />
          </View>
        )}

        {/* Prompt 2 */}
        {profile.prompts?.length > 1 && (
          <View style={[cardStyle, styles.hingePadding]}>
            <ThemedText style={styles.hingePromptQ}>{profile.prompts[1].question}</ThemedText>
            <ThemedText style={styles.hingePromptA}>{profile.prompts[1].answer}</ThemedText>
          </View>
        )}
      </View>
    );
  };
`;

fileContent = fileContent.substring(0, renderProfileStart) + newRenderProfile + "\n  " + fileContent.substring(renderProfileEnd);

// 2. Modify styles.card
const cardStyleStart = fileContent.indexOf('card: {');
const cardStyleEnd = fileContent.indexOf('},', cardStyleStart);

const newCardStyle = `card: {
    width: SCREEN_WIDTH - 16,
    flex: 1,
    borderRadius: 24,
    backgroundColor: "transparent",
    overflow: "hidden",
    elevation: 0,
  }`;

fileContent = fileContent.substring(0, cardStyleStart) + newCardStyle + fileContent.substring(cardStyleEnd + 2);

// 3. Add Hinge Styles
const stylesEndMatcher = '});\n';
const hingeStyles = `
  hingeContainer: {
    padding: 16,
    paddingTop: 8,
  },
  hingeHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  hingeName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  hingeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hingeLocationText: {
    fontSize: 15,
    marginLeft: 6,
    opacity: 0.7,
  },
  hingeCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  hingePadding: {
    padding: 24,
  },
  hingeImage: {
    width: "100%",
    aspectRatio: 0.8,
    resizeMode: "cover",
  },
  hingePromptQ: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: 12,
  },
  hingePromptA: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", 
  },
  hingeTraitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  hingeTraitText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
`;

const lastClosingBrace = fileContent.lastIndexOf('});');
fileContent = fileContent.substring(0, lastClosingBrace) + hingeStyles + fileContent.substring(lastClosingBrace);

// 4. In `renderLikesTab`, change likes container background color
// It's in the detail modal container: backgroundColor: isDark ? "#000" : "#F4F4F4"
// That's fine.

fs.writeFileSync('src/components/domain/matching/MatchScreen.tsx', fileContent);
