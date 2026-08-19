import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquareText,
  Play,
  Sparkles,
  Target,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react-native";

import { useTheme } from "@/src/hooks/useTheme";
import {
  createInterviewPlan,
  deleteInterviewPlan,
  evaluateInterviewAnswer,
  extractCv,
  getInterviewPlan,
  getInterviewPlans,
  type AnswerFeedback,
  type InterviewPlan,
  type InterviewPlanSummary,
  type InterviewQuestion,
} from "@/src/services/interviewCoachService";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact, success } from "@/src/utils/haptics";

type DashboardTab = "overview" | "practice" | "plan";

const categoryLabels: Record<string, string> = {
  opening: "Açılış",
  cv_deep_dive: "CV Derinleşmesi",
  behavioral: "Davranışsal",
  technical: "Teknik",
  role_specific: "Role Özel",
  company: "Şirket",
  failure: "Hata & Öğrenme",
  pressure: "Baskı Altında",
  closing: "Kapanış",
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          styles.input,
          multiline && styles.textArea,
          { color: colors.text.primary, backgroundColor: colors.background.tertiary, borderColor: colors.surface.border },
        ]}
      />
    </View>
  );
}

function ScoreRing({ score, label, color, textColor }: { score: number; label: string; color: string; textColor: string }) {
  return (
    <View style={styles.scoreBlock}>
      <View style={[styles.scoreRing, { borderColor: color, backgroundColor: color + "12" }]}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
      </View>
      <Text style={[styles.scoreLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function BulletList({ items, color, textColor }: { items: string[]; color: string; textColor: string }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: color }]} />
          <Text style={[styles.bulletText, { color: textColor }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function InterviewCoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [plans, setPlans] = useState<InterviewPlanSummary[]>([]);
  const [activePlan, setActivePlan] = useState<InterviewPlan | null>(null);
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [openingPlan, setOpeningPlan] = useState<number | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvFilename, setCvFilename] = useState("");
  const [uploadingCv, setUploadingCv] = useState(false);
  const [consentAiProcessing, setConsentAiProcessing] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setPlans(await getInterviewPlans());
    } catch (error) {
      Alert.alert("Planlar yüklenemedi", handleApiError(error).userMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const openPlan = async (id: number) => {
    try {
      setOpeningPlan(id);
      const plan = await getInterviewPlan(id);
      setActivePlan(plan);
      const firstUnanswered = plan.questions.findIndex((item) => item.score == null);
      setQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      setAnswer("");
      setFeedback(null);
      setTab("overview");
      lightImpact();
    } catch (error) {
      Alert.alert("Plan açılamadı", handleApiError(error).userMessage);
    } finally {
      setOpeningPlan(null);
    }
  };

  const pickCv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setUploadingCv(true);
      const extracted = await extractCv({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
      });
      setCvText(extracted.text);
      setCvFilename(extracted.filename);
      success();
    } catch (error) {
      Alert.alert("CV okunamadı", handleApiError(error).userMessage);
    } finally {
      setUploadingCv(false);
    }
  };

  const submitPlan = async () => {
    if (companyName.trim().length < 2 || roleTitle.trim().length < 2) {
      Alert.alert("Eksik bilgi", "Şirket ve pozisyon adını girin.");
      return;
    }
    if (jobDescription.trim().length < 80) {
      Alert.alert("İlan metni kısa", "Daha doğru analiz için iş ilanının tamamını yapıştırın.");
      return;
    }
    if (cvText.trim().length < 80) {
      Alert.alert("CV gerekli", "CV dosyanızı yükleyin veya CV metnini yapıştırın.");
      return;
    }
    if (!consentAiProcessing) {
      Alert.alert("Onay gerekli", "Analiz için AI veri işleme bilgilendirmesini onaylayın.");
      return;
    }
    try {
      setCreating(true);
      const plan = await createInterviewPlan({
        company_name: companyName.trim(),
        role_title: roleTitle.trim(),
        job_description: jobDescription.trim(),
        cv_text: cvText.trim(),
        interview_language: "tr",
        consent_ai_processing: true,
      });
      setPlans((current) => [plan, ...current]);
      setActivePlan(plan);
      setShowForm(false);
      setTab("overview");
      setQuestionIndex(0);
      success();
    } catch (error) {
      Alert.alert("Analiz tamamlanamadı", handleApiError(error).userMessage);
    } finally {
      setCreating(false);
    }
  };

  const currentQuestion: InterviewQuestion | undefined = activePlan?.questions[questionIndex];

  useEffect(() => {
    setAnswer("");
    setFeedback(currentQuestion?.feedback || null);
  }, [currentQuestion?.id, currentQuestion?.feedback]);

  const evaluate = async () => {
    if (!activePlan || !currentQuestion || answer.trim().length < 20) {
      Alert.alert("Cevap çok kısa", "Gerçek bir prova için en az birkaç cümleyle cevap verin.");
      return;
    }
    try {
      setEvaluating(true);
      const result = await evaluateInterviewAnswer(activePlan.id, currentQuestion.id, answer.trim());
      setFeedback(result.feedback);
      setActivePlan((plan) => plan ? {
        ...plan,
        readiness_score: result.readiness_score,
        answered_count: plan.questions.filter((item) => item.id === currentQuestion.id ? true : item.score != null).length,
        questions: plan.questions.map((item) => item.id === currentQuestion.id ? {
          ...item,
          feedback: result.feedback,
          score: result.score,
        } : item),
      } : plan);
      setPlans((current) => current.map((item) => item.id === activePlan.id ? {
        ...item,
        readiness_score: result.readiness_score,
        answered_count: activePlan.questions.filter((question) => question.id === currentQuestion.id ? true : question.score != null).length,
      } : item));
      success();
    } catch (error) {
      Alert.alert("Cevap değerlendirilemedi", handleApiError(error).userMessage);
    } finally {
      setEvaluating(false);
    }
  };

  const confirmDelete = (plan: InterviewPlanSummary) => {
    Alert.alert(
      "Planı sil",
      `${plan.company_name} – ${plan.role_title} hazırlık planı ve tüm cevaplar silinecek.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInterviewPlan(plan.id);
              setPlans((current) => current.filter((item) => item.id !== plan.id));
            } catch (error) {
              Alert.alert("Silinemedi", handleApiError(error).userMessage);
            }
          },
        },
      ],
    );
  };

  const progress = useMemo(() => {
    if (!activePlan?.question_count) return 0;
    return Math.round((activePlan.answered_count / activePlan.question_count) * 100);
  }, [activePlan]);

  const Header = () => (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 14), borderBottomColor: colors.surface.border }]}>
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: colors.surface.default }]}
        onPress={() => activePlan ? setActivePlan(null) : router.back()}
      >
        <ArrowLeft size={21} color={colors.text.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleWrap}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Mülakat Koçu</Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>CV + ilana özel hazırlık</Text>
      </View>
      {activePlan ? (
        <TouchableOpacity style={[styles.headerButton, { backgroundColor: colors.surface.default }]} onPress={() => setActivePlan(null)}>
          <X size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      ) : <View style={styles.headerButton} />}
    </View>
  );

  if (creating) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <Header />
        <View style={styles.centerState}>
          <LinearGradient colors={[colors.accent.primary + "30", colors.accent.primary + "08"]} style={styles.thinkingIcon}>
            <BrainCircuit size={42} color={colors.accent.primary} />
          </LinearGradient>
          <ActivityIndicator size="small" color={colors.accent.primary} style={{ marginTop: 24 }} />
          <Text style={[styles.thinkingTitle, { color: colors.text.primary }]}>Hazırlık planın oluşturuluyor</Text>
          <Text style={[styles.thinkingText, { color: colors.text.secondary }]}>CV–ilan eşleşmesi, yetkinlik açıkları, olası sorular ve 5 günlük çalışma planı hazırlanıyor.</Text>
          <View style={[styles.privacyNote, { backgroundColor: colors.surface.default }]}>
            <CheckCircle2 size={16} color={colors.semantic.success} />
            <Text style={[styles.privacyText, { color: colors.text.secondary }]}>Yalnızca kendi hesabından erişebilirsin.</Text>
          </View>
        </View>
      </View>
    );
  }

  if (activePlan) {
    const analysis = activePlan.analysis;
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <Header />
        <View style={[styles.tabBar, { borderBottomColor: colors.surface.border }]}>
          {(["overview", "practice", "plan"] as DashboardTab[]).map((item) => {
            const labels = { overview: "Analiz", practice: "Prova", plan: "Plan" };
            const selected = tab === item;
            return (
              <TouchableOpacity key={item} style={styles.tabButton} onPress={() => setTab(item)}>
                <Text style={[styles.tabText, { color: selected ? colors.accent.primary : colors.text.tertiary }]}>{labels[item]}</Text>
                {selected && <View style={[styles.tabIndicator, { backgroundColor: colors.accent.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === "overview" && (
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={[colors.accent.primary + "22", colors.background.secondary]} style={[styles.heroCard, { borderColor: colors.accent.primary + "35" }]}>
              <View style={styles.companyLine}>
                <Building2 size={17} color={colors.accent.primary} />
                <Text style={[styles.companyName, { color: colors.accent.primary }]}>{activePlan.company_name}</Text>
              </View>
              <Text style={[styles.roleTitle, { color: colors.text.primary }]}>{activePlan.role_title}</Text>
              <Text style={[styles.summary, { color: colors.text.secondary }]}>{analysis.executive_summary}</Text>
              <View style={styles.scoreRow}>
                <ScoreRing score={activePlan.match_score} label="İlan eşleşmesi" color={colors.accent.primary} textColor={colors.text.secondary} />
                <View style={[styles.scoreDivider, { backgroundColor: colors.surface.border }]} />
                <ScoreRing score={activePlan.readiness_score} label="Hazırbulunuşluk" color={colors.semantic.info} textColor={colors.text.secondary} />
              </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.semantic.success + "18" }]}><Award size={19} color={colors.semantic.success} /></View>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Güçlü tarafların</Text>
            </View>
            {analysis.strengths.map((item, index) => (
              <View key={`${item.title}-${index}`} style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text.primary }]}>{item.title}</Text>
                <Text style={[styles.cardBody, { color: colors.text.secondary }]}>{item.evidence}</Text>
                <View style={[styles.tipBox, { backgroundColor: colors.semantic.success + "10" }]}>
                  <Zap size={14} color={colors.semantic.success} />
                  <Text style={[styles.tipText, { color: colors.text.secondary }]}>{item.how_to_use}</Text>
                </View>
              </View>
            ))}

            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.semantic.warning + "18" }]}><AlertTriangle size={19} color={colors.semantic.warning} /></View>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Kapatman gereken açıklar</Text>
            </View>
            {analysis.gaps.map((gap, index) => (
              <View key={`${gap.skill}-${index}`} style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: colors.text.primary, flex: 1 }]}>{gap.skill}</Text>
                  <Text style={[styles.priority, { color: colors.semantic.warning, backgroundColor: colors.semantic.warning + "15" }]}>{gap.priority}</Text>
                </View>
                <Text style={[styles.cardBody, { color: colors.text.secondary }]}>{gap.risk}</Text>
                <Text style={[styles.actionText, { color: colors.accent.primary }]}>Aksiyon: {gap.action}</Text>
              </View>
            ))}

            <View style={[styles.pitchCard, { backgroundColor: colors.accent.primary + "10", borderColor: colors.accent.primary + "30" }]}>
              <MessageSquareText size={22} color={colors.accent.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text.primary }]}>60 saniyelik tanıtımın</Text>
                <Text style={[styles.cardBody, { color: colors.text.secondary }]}>{analysis.elevator_pitch}</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {tab === "practice" && currentQuestion && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]} keyboardShouldPersistTaps="handled">
              <View style={styles.practiceTopRow}>
                <Text style={[styles.questionCounter, { color: colors.text.secondary }]}>Soru {questionIndex + 1} / {activePlan.questions.length}</Text>
                <Text style={[styles.progressText, { color: colors.accent.primary }]}>%{progress} tamamlandı</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.surface.border }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.accent.primary }]} />
              </View>

              <View style={[styles.questionCard, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
                <View style={styles.badgeRow}>
                  <Text style={[styles.categoryBadge, { color: colors.accent.primary, backgroundColor: colors.accent.primary + "14" }]}>{categoryLabels[currentQuestion.category] || currentQuestion.category}</Text>
                  <Text style={[styles.difficultyBadge, { color: colors.text.secondary, backgroundColor: colors.surface.default }]}>{currentQuestion.difficulty}</Text>
                </View>
                <Text style={[styles.questionText, { color: colors.text.primary }]}>{currentQuestion.question}</Text>
                <Text style={[styles.rationale, { color: colors.text.tertiary }]}>Neden sorulur: {currentQuestion.rationale}</Text>
              </View>

              <View style={[styles.frameworkCard, { backgroundColor: colors.surface.default }]}>
                <Target size={18} color={colors.accent.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.frameworkTitle, { color: colors.text.primary }]}>Güçlü cevap çerçevesi</Text>
                  <BulletList items={currentQuestion.answer_framework} color={colors.accent.primary} textColor={colors.text.secondary} />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Cevabın</Text>
              <TextInput
                value={answer}
                onChangeText={setAnswer}
                placeholder="Cevabını STAR yöntemiyle yaz veya konuşarak metne dönüştür..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                textAlignVertical="top"
                style={[styles.answerInput, { color: colors.text.primary, backgroundColor: colors.background.tertiary, borderColor: colors.surface.border }]}
              />
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.accent.primary }]} onPress={evaluate} disabled={evaluating}>
                {evaluating ? <ActivityIndicator color={colors.accent.onPrimary} /> : <Sparkles size={19} color={colors.accent.onPrimary} />}
                <Text style={[styles.primaryButtonText, { color: colors.accent.onPrimary }]}>{evaluating ? "Değerlendiriliyor" : "Cevabımı değerlendir"}</Text>
              </TouchableOpacity>

              {feedback && (
                <View style={[styles.feedbackCard, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
                  <View style={styles.feedbackHeader}>
                    <ScoreRing score={feedback.score} label={feedback.verdict} color={feedback.score >= 80 ? colors.semantic.success : colors.semantic.warning} textColor={colors.text.secondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.feedbackTitle, { color: colors.text.primary }]}>Koç değerlendirmesi</Text>
                      <Text style={[styles.feedbackSubtitle, { color: colors.text.secondary }]}>Cevabın kanıt, yapı ve role uygunluk açısından puanlandı.</Text>
                    </View>
                  </View>
                  <Text style={[styles.subheading, { color: colors.semantic.success }]}>Güçlü noktalar</Text>
                  <BulletList items={feedback.strengths || []} color={colors.semantic.success} textColor={colors.text.secondary} />
                  <Text style={[styles.subheading, { color: colors.semantic.warning }]}>Geliştir</Text>
                  <BulletList items={feedback.improvements || []} color={colors.semantic.warning} textColor={colors.text.secondary} />
                  <View style={[styles.improvedAnswer, { backgroundColor: colors.surface.default }]}>
                    <Text style={[styles.subheading, { color: colors.text.primary }]}>Daha güçlü yapı</Text>
                    <Text style={[styles.cardBody, { color: colors.text.secondary }]}>{feedback.improved_answer}</Text>
                  </View>
                  <Text style={[styles.nextDrill, { color: colors.accent.primary }]}>{feedback.next_drill}</Text>
                </View>
              )}

              <View style={styles.navigationRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.surface.border }]}
                  disabled={questionIndex === 0}
                  onPress={() => setQuestionIndex((index) => Math.max(0, index - 1))}
                >
                  <Text style={[styles.secondaryButtonText, { color: questionIndex === 0 ? colors.text.tertiary : colors.text.primary }]}>Önceki</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.surface.border }]}
                  disabled={questionIndex === activePlan.questions.length - 1}
                  onPress={() => setQuestionIndex((index) => Math.min(activePlan.questions.length - 1, index + 1))}
                >
                  <Text style={[styles.secondaryButtonText, { color: questionIndex === activePlan.questions.length - 1 ? colors.text.tertiary : colors.text.primary }]}>Sonraki</Text>
                  <ChevronRight size={17} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {tab === "plan" && (
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.primary + "18" }]}><CalendarDays size={19} color={colors.accent.primary} /></View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>5 günlük çalışma planı</Text>
                <Text style={[styles.sectionCaption, { color: colors.text.tertiary }]}>Her gün ölçülebilir bir hedefe odaklan</Text>
              </View>
            </View>
            {analysis.study_plan.map((day, index) => (
              <View key={`${day.day}-${index}`} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.dayCircle, { backgroundColor: colors.accent.primary }]}><Text style={styles.dayNumber}>{day.day}</Text></View>
                  {index < analysis.study_plan.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.surface.border }]} />}
                </View>
                <View style={[styles.timelineCard, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.text.primary }]}>{day.focus}</Text>
                  <BulletList items={day.tasks} color={colors.accent.primary} textColor={colors.text.secondary} />
                  <View style={[styles.metricBox, { backgroundColor: colors.semantic.success + "10" }]}>
                    <CheckCircle2 size={14} color={colors.semantic.success} />
                    <Text style={[styles.metricText, { color: colors.text.secondary }]}>{day.success_metric}</Text>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.semantic.info + "18" }]}><MessageSquareText size={19} color={colors.semantic.info} /></View>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Şirkete soracağın güçlü sorular</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
              <BulletList items={analysis.questions_to_ask} color={colors.semantic.info} textColor={colors.text.secondary} />
            </View>

            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.semantic.success + "18" }]}><CheckCircle2 size={19} color={colors.semantic.success} /></View>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Son kontrol</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
              <BulletList items={analysis.final_checklist} color={colors.semantic.success} textColor={colors.text.secondary} />
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background.primary }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.accent.primary + "26", colors.background.secondary]} style={[styles.landingHero, { borderColor: colors.accent.primary + "35" }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.accent.primary + "1F" }]}><BrainCircuit size={32} color={colors.accent.primary} /></View>
          <Text style={[styles.landingTitle, { color: colors.text.primary }]}>Mülakata şansa bırakmadan hazırlan</Text>
          <Text style={[styles.landingText, { color: colors.text.secondary }]}>{"CV'ni iş ilanıyla karşılaştırır, açıklarını bulur, şirkete özel sorular üretir ve cevaplarını 100 üzerinden puanlar."}</Text>
          <View style={styles.featureRow}>
            <View style={styles.feature}><Target size={16} color={colors.accent.primary} /><Text style={[styles.featureText, { color: colors.text.secondary }]}>Eşleşme</Text></View>
            <View style={styles.feature}><Play size={16} color={colors.accent.primary} /><Text style={[styles.featureText, { color: colors.text.secondary }]}>Prova</Text></View>
            <View style={styles.feature}><Award size={16} color={colors.accent.primary} /><Text style={[styles.featureText, { color: colors.text.secondary }]}>Puanlama</Text></View>
          </View>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.accent.primary }]} onPress={() => setShowForm((value) => !value)}>
            <Sparkles size={19} color={colors.accent.onPrimary} />
            <Text style={[styles.primaryButtonText, { color: colors.accent.onPrimary }]}>{showForm ? "Formu kapat" : "Yeni hazırlık başlat"}</Text>
          </TouchableOpacity>
        </LinearGradient>

        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
            <View style={styles.formTitleRow}><BriefcaseBusiness size={22} color={colors.accent.primary} /><Text style={[styles.formTitle, { color: colors.text.primary }]}>Hedef pozisyon</Text></View>
            <Field label="Şirket" value={companyName} onChangeText={setCompanyName} placeholder="Örn. Trendyol" colors={colors} />
            <Field label="Pozisyon" value={roleTitle} onChangeText={setRoleTitle} placeholder="Örn. Senior Backend Developer" colors={colors} />
            <Field label="İş ilanı" value={jobDescription} onChangeText={setJobDescription} placeholder="İş ilanının tamamını buraya yapıştır..." multiline colors={colors} />

            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>CV</Text>
            <TouchableOpacity style={[styles.uploadBox, { borderColor: cvFilename ? colors.semantic.success : colors.surface.border, backgroundColor: colors.background.tertiary }]} onPress={pickCv} disabled={uploadingCv}>
              {uploadingCv ? <ActivityIndicator color={colors.accent.primary} /> : cvFilename ? <CheckCircle2 size={24} color={colors.semantic.success} /> : <Upload size={24} color={colors.accent.primary} />}
              <View style={{ flex: 1 }}>
                <Text style={[styles.uploadTitle, { color: colors.text.primary }]}>{cvFilename || "PDF, DOCX veya TXT yükle"}</Text>
                <Text style={[styles.uploadText, { color: colors.text.tertiary }]}>{cvFilename ? `${cvText.length.toLocaleString("tr-TR")} karakter okundu` : "En fazla 5 MB · yalnızca metin analiz edilir"}</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.orText, { color: colors.text.tertiary }]}>veya CV metnini yapıştır</Text>
            <TextInput
              value={cvText}
              onChangeText={(value) => { setCvText(value); if (cvFilename) setCvFilename(""); }}
              placeholder="Deneyim, eğitim, projeler ve beceriler..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.cvArea, { color: colors.text.primary, backgroundColor: colors.background.tertiary, borderColor: colors.surface.border }]}
            />
            <TouchableOpacity
              style={[styles.consentRow, { backgroundColor: colors.surface.default, borderColor: consentAiProcessing ? colors.accent.primary : colors.surface.border }]}
              onPress={() => setConsentAiProcessing((value) => !value)}
              activeOpacity={0.75}
            >
              <View style={[styles.checkbox, { borderColor: consentAiProcessing ? colors.accent.primary : colors.text.tertiary, backgroundColor: consentAiProcessing ? colors.accent.primary : "transparent" }]}>
                {consentAiProcessing && <CheckCircle2 size={15} color={colors.accent.onPrimary} />}
              </View>
              <Text style={[styles.consentText, { color: colors.text.secondary }]}>
                CV, ilan ve prova cevaplarımın analiz için yapılandırılmış AI sağlayıcısına gönderileceğini kabul ediyorum. Ham CV, ilan ve cevap metinleri veritabanında saklanmaz; planı istediğim zaman silebilirim.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.accent.primary }]} onPress={submitPlan}>
              <BrainCircuit size={19} color={colors.accent.onPrimary} />
              <Text style={[styles.primaryButtonText, { color: colors.accent.onPrimary }]}>Detaylı analiz oluştur</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.surface.default }]}><FileText size={19} color={colors.text.secondary} /></View>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Hazırlıkların</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.accent.primary} style={{ marginTop: 28 }} />
        ) : plans.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: colors.surface.border }]}>
            <BriefcaseBusiness size={28} color={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Henüz hazırlık planın yok</Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>İlk ilanını eklediğinde kişisel yol haritan burada görünecek.</Text>
          </View>
        ) : plans.map((plan) => (
          <View key={plan.id} style={[styles.planCard, { backgroundColor: colors.background.secondary, borderColor: colors.surface.border }]}>
            <TouchableOpacity style={styles.planOpenArea} onPress={() => openPlan(plan.id)} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={`${plan.company_name} hazırlık planını aç`}>
              <View style={[styles.planIcon, { backgroundColor: colors.accent.primary + "15" }]}><Building2 size={21} color={colors.accent.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planCompany, { color: colors.text.primary }]} numberOfLines={1}>{plan.company_name}</Text>
                <Text style={[styles.planRole, { color: colors.text.secondary }]} numberOfLines={1}>{plan.role_title}</Text>
                <Text style={[styles.planMeta, { color: colors.text.tertiary }]}>{plan.answered_count}/{plan.question_count} prova · %{plan.match_score} eşleşme</Text>
              </View>
              <View style={[styles.miniScore, { borderColor: colors.accent.primary }]}><Text style={[styles.miniScoreText, { color: colors.accent.primary }]}>{plan.readiness_score}</Text></View>
              {openingPlan === plan.id ? <ActivityIndicator color={colors.accent.primary} /> : <ChevronRight size={19} color={colors.text.tertiary} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.deletePlanButton} onPress={() => confirmDelete(plan)} accessibilityRole="button" accessibilityLabel="Hazırlık planını sil">
              <Trash2 size={17} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 76, paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "flex-end", borderBottomWidth: StyleSheet.hairlineWidth },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitleWrap: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { fontSize: 11, marginTop: 2 },
  scrollContent: { padding: 16, gap: 14 },
  landingHero: { borderRadius: 26, padding: 22, borderWidth: 1, overflow: "hidden" },
  heroIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  landingTitle: { fontSize: 28, lineHeight: 33, fontWeight: "900", letterSpacing: -0.8 },
  landingText: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  featureRow: { flexDirection: "row", marginVertical: 20, gap: 18 },
  feature: { flexDirection: "row", alignItems: "center", gap: 6 },
  featureText: { fontSize: 12, fontWeight: "600" },
  primaryButton: { minHeight: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: 18 },
  primaryButtonText: { fontSize: 15, fontWeight: "800" },
  formCard: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 14 },
  formTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  formTitle: { fontSize: 19, fontWeight: "800" },
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 13, fontWeight: "700" },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  textArea: { minHeight: 145, paddingTop: 13 },
  cvArea: { minHeight: 120, paddingTop: 13 },
  consentRow: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  consentText: { flex: 1, fontSize: 11.5, lineHeight: 17 },
  uploadBox: { minHeight: 78, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 13 },
  uploadTitle: { fontSize: 14, fontWeight: "700" },
  uploadText: { fontSize: 11, marginTop: 3 },
  orText: { fontSize: 11, textAlign: "center", marginVertical: -2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, marginBottom: 2 },
  sectionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionCaption: { fontSize: 11, marginTop: 2 },
  emptyCard: { borderRadius: 20, borderWidth: 1, borderStyle: "dashed", alignItems: "center", padding: 28 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 },
  planCard: { minHeight: 88, borderRadius: 18, borderWidth: 1, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  planOpenArea: { flex: 1, minHeight: 88, padding: 13, flexDirection: "row", alignItems: "center", gap: 11 },
  deletePlanButton: { width: 44, minHeight: 88, alignItems: "center", justifyContent: "center" },
  planIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  planCompany: { fontSize: 15, fontWeight: "800" },
  planRole: { fontSize: 13, marginTop: 2 },
  planMeta: { fontSize: 10, marginTop: 5 },
  miniScore: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  miniScoreText: { fontSize: 12, fontWeight: "900" },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  thinkingIcon: { width: 94, height: 94, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  thinkingTitle: { fontSize: 22, fontWeight: "900", marginTop: 18, textAlign: "center" },
  thinkingText: { fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 9 },
  privacyNote: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, padding: 12, marginTop: 22 },
  privacyText: { fontSize: 12 },
  tabBar: { height: 52, flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  tabText: { fontSize: 13, fontWeight: "700" },
  tabIndicator: { position: "absolute", height: 2, width: 38, bottom: 0, borderRadius: 2 },
  heroCard: { borderRadius: 24, borderWidth: 1, padding: 20 },
  companyLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  companyName: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  roleTitle: { fontSize: 25, lineHeight: 30, fontWeight: "900", marginTop: 9, letterSpacing: -0.5 },
  summary: { fontSize: 14, lineHeight: 21, marginTop: 10 },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 22 },
  scoreBlock: { flex: 1, alignItems: "center" },
  scoreRing: { width: 70, height: 70, borderRadius: 35, borderWidth: 5, alignItems: "center", justifyContent: "center" },
  scoreValue: { fontSize: 23, fontWeight: "900" },
  scoreLabel: { fontSize: 11, fontWeight: "600", marginTop: 7, textAlign: "center" },
  scoreDivider: { width: 1, height: 56 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  cardBody: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, padding: 10, marginTop: 11 },
  tipText: { fontSize: 12, lineHeight: 17, flex: 1 },
  priority: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 },
  actionText: { fontSize: 12, lineHeight: 18, fontWeight: "600", marginTop: 9 },
  pitchCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 18, borderWidth: 1, padding: 16 },
  bulletList: { gap: 8, marginTop: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  bulletText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  practiceTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  questionCounter: { fontSize: 13, fontWeight: "700" },
  progressText: { fontSize: 12, fontWeight: "800" },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  questionCard: { borderRadius: 22, borderWidth: 1, padding: 18 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  categoryBadge: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  difficultyBadge: { fontSize: 10, fontWeight: "700", textTransform: "capitalize", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  questionText: { fontSize: 20, lineHeight: 28, fontWeight: "800" },
  rationale: { fontSize: 11.5, lineHeight: 17, marginTop: 12 },
  frameworkCard: { flexDirection: "row", alignItems: "flex-start", gap: 11, borderRadius: 16, padding: 14 },
  frameworkTitle: { fontSize: 13, fontWeight: "800" },
  answerInput: { minHeight: 170, borderRadius: 16, borderWidth: 1, padding: 14, fontSize: 14, lineHeight: 20 },
  feedbackCard: { borderRadius: 22, borderWidth: 1, padding: 18 },
  feedbackHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  feedbackTitle: { fontSize: 17, fontWeight: "800" },
  feedbackSubtitle: { fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  subheading: { fontSize: 12, fontWeight: "800", marginTop: 12, textTransform: "uppercase", letterSpacing: 0.4 },
  improvedAnswer: { borderRadius: 14, padding: 13, marginTop: 14 },
  nextDrill: { fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 14 },
  navigationRow: { flexDirection: "row", gap: 10 },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  secondaryButtonText: { fontSize: 13, fontWeight: "700" },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineRail: { width: 36, alignItems: "center" },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", zIndex: 2 },
  dayNumber: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  timelineLine: { width: 2, flex: 1, minHeight: 90 },
  timelineCard: { flex: 1, borderRadius: 17, borderWidth: 1, padding: 15, marginBottom: 4 },
  metricBox: { flexDirection: "row", alignItems: "flex-start", gap: 7, borderRadius: 11, padding: 9, marginTop: 11 },
  metricText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
