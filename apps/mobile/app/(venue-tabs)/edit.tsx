import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Modal, Image, KeyboardAvoidingView, Platform, FlatList, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '@/src/components/ui';
import { getMyVenue, updateMyVenue, Place } from '@/src/services/mekanService';
import { lightImpact, success } from '@/src/utils/haptics';
import { useScrollToTop } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function VenueEditScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [venue, setVenue] = useState<Place | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [campaign, setCampaign] = useState('');
  const [featureList, setFeatureList] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('23:00');
  const [isOpen, setIsOpen] = useState(true);
  const [priceRange, setPriceRange] = useState(2);
  const [galleryImages, setGalleryImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200',
    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=200',
    'https://images.unsplash.com/photo-1511920170033-f8396924c648?w=200'
  ]);

  // Modals
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  // Fake Menu State
  const [menuItems, setMenuItems] = useState([
    { id: 1, name: 'Americano', desc: 'Sert espresso ve sıcak su', price: '120 ₺', img: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=200', category: 'İçecek' },
    { id: 2, name: 'Latte', desc: 'İpeksi süt köpüğü ile', price: '140 ₺', img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200', category: 'İçecek' }
  ]);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuDesc, setNewMenuDesc] = useState('');
  const [newMenuImg, setNewMenuImg] = useState<string | null>(null);
  const [newMenuCategory, setNewMenuCategory] = useState('');

  // Menu Upload Type Preference
  const [menuUploadType, setMenuUploadType] = useState<'text' | 'image'>('text');
  const [menuPhotos, setMenuPhotos] = useState<string[]>([]);

  // Fake Reviews State
  const [reviews, setReviews] = useState([
    { id: 1, user: 'Ahmet Y.', avatar: 'https://i.pravatar.cc/100?img=11', text: 'Harika bir mekan, kahveleri süper!', rating: 5, date: '2 gün önce', reply: '' },
    { id: 2, user: 'Selin K.', avatar: 'https://i.pravatar.cc/100?img=5', text: 'Biraz kalabalıktı ama servis fena değil.', rating: 3, date: '1 hafta önce', reply: '' }
  ]);
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    async function fetchVenue() {
      try {
        const data = await getMyVenue();
        if (data) {
          setVenue(data);
          setName(data.name || '');
          setAddress(data.address || '');
          setCampaign(data.campaign_text || '');
          if (data.features) {
            setFeatureList(data.features.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0));
          }
          setCoverPhoto(data.photo_url || null);
          setOpeningTime(data.opening_time || '09:00');
          setClosingTime(data.closing_time || '23:00');
          
          if (data.menu_items && Array.isArray(data.menu_items) && data.menu_items.length > 0) {
            const first = data.menu_items[0];
            if (first.type === 'image') {
              setMenuUploadType('image');
              setMenuPhotos(data.menu_items.map((m: any) => m.uri));
            } else {
              setMenuUploadType('text');
              setMenuItems(data.menu_items);
            }
          }
        }
      } catch (err) {
        console.error("Mekan detayları alınamadı", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVenue();
  }, []);

  const handleSave = async () => {
    lightImpact();
    setSaving(true);
    try {
      const menuPayload = menuUploadType === 'image'
        ? menuPhotos.map((uri, i) => ({ id: i, type: 'image', uri }))
        : menuItems;

      const updated = await updateMyVenue({
        name,
        address,
        campaign_text: campaign,
        features: featureList.join(', '),
        photo_url: coverPhoto || undefined,
        opening_time: openingTime,
        closing_time: closingTime,
        menu_items: menuPayload,
      });
      if (updated) {
        setVenue(updated);
        success();
        Alert.alert("Başarılı", "İşletme bilgileriniz güncellendi.");
      }
    } catch (error) {
      Alert.alert("Hata", "İşletme detayları güncellenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    lightImpact();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCoverPhoto(result.assets[0].uri);
    }
  };

  const pickGalleryImage = async () => {
    lightImpact();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setGalleryImages([result.assets[0].uri, ...galleryImages]);
    }
  };

  const pickMenuItemImage = async () => {
    lightImpact();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewMenuImg(result.assets[0].uri);
    }
  };

  const pickMenuPhoto = async () => {
    lightImpact();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setMenuPhotos([...menuPhotos, result.assets[0].uri]);
    }
  };

  const addMenuItem = () => {
    if (!newMenuName || !newMenuPrice) return;
    setMenuItems([{ 
      id: Date.now(), 
      name: newMenuName, 
      desc: newMenuDesc || 'İşletme Spesiyali', 
      price: newMenuPrice + ' ₺', 
      img: newMenuImg || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
      category: newMenuCategory || 'Menü',
    }, ...menuItems]);
    setNewMenuName('');
    setNewMenuPrice('');
    setNewMenuDesc('');
    setNewMenuImg(null);
    setNewMenuCategory('');
    success();
  };

  const submitReply = (reviewId: number) => {
    const rx = replyInputs[reviewId];
    if (!rx) return;
    setReviews(reviews.map(r => r.id === reviewId ? { ...r, reply: rx } : r));
    success();
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      {/* Decorative top gradient */}
      <LinearGradient colors={['rgba(59, 130, 246, 0.15)', 'transparent']} style={styles.topGradientGlow} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView 
          ref={scrollRef} 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.header}>
            <Text style={styles.title}>İşletme Paneli</Text>
            <Text style={styles.subtitle}>Mekanınızın vitrinini, menüsünü ve müşteri etkileşimlerini doğrudan buradan profesyonelce yönetin.</Text>
          </Animated.View>

          {/* Quick Actions Grid */}
          <Animated.View entering={FadeInDown.duration(500).delay(100).springify()} style={styles.quickActionsGrid}>
            <TouchableOpacity onPress={() => { lightImpact(); setShowMediaModal(true); }} activeOpacity={0.8} style={{flex: 1, marginHorizontal: 4}}>
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={styles.actionTile}>
                <View style={[styles.actionIconRound, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <IconSymbol name="photo.on.rectangle.angled" size={24} color="#60a5fa" />
                </View>
                <Text style={styles.actionTileText}>Vitrin & Medya</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { lightImpact(); setShowMenuModal(true); }} activeOpacity={0.8} style={{flex: 1, marginHorizontal: 4}}>
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={styles.actionTile}>
                <View style={[styles.actionIconRound, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <IconSymbol name="list.bullet.clipboard.fill" size={24} color="#fcd34d" />
                </View>
                <Text style={styles.actionTileText}>Menü</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { lightImpact(); setShowReviewsModal(true); }} activeOpacity={0.8} style={{flex: 1, marginHorizontal: 4}}>
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={styles.actionTile}>
                <View style={[styles.actionIconRound, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <IconSymbol name="star.bubble.fill" size={24} color="#34d399" />
                </View>
                <Text style={styles.actionTileText}>Yorumlar</Text>
                <View style={styles.notificationBadge}><Text style={styles.badgeText}>2</Text></View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Status Toggle */}
          <Animated.View entering={FadeInDown.duration(500).delay(150).springify()} style={styles.statusToggleContainer}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={[styles.statusDot, { backgroundColor: isOpen ? '#10b981' : '#ef4444' }]} />
              <Text style={styles.statusToggleText}>Mekan Şu An {isOpen ? 'Açık' : 'Kapalı'}</Text>
            </View>
            <Switch 
              value={isOpen} 
              onValueChange={(val) => { lightImpact(); setIsOpen(val); }} 
              trackColor={{ false: '#3f3f46', true: '#34d399' }}
              thumbColor={isOpen ? '#ffffff' : '#a1a1aa'}
            />
          </Animated.View>

          {/* Forms Section */}
          <Animated.View entering={FadeIn.duration(600).delay(200)}>
            {/* Temel Bilgiler */}
            <View style={styles.sectionMargin}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconAccent}><IconSymbol name="building.2.fill" size={18} color="#60a5fa" /></View>
                <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
              </View>
              <BlurView intensity={20} tint="dark" style={styles.sectionCard}>
                <Input label="Mekan Adı" value={name} onChangeText={setName} containerStyle={styles.inputContainer} />
                <Input label="Telefon Numarası" value={phone} onChangeText={setPhone} placeholder="+90 5XX XXX XX XX" containerStyle={styles.inputContainer} keyboardType="phone-pad" />
                <Input label="Adres" value={address} onChangeText={setAddress} containerStyle={{marginBottom: 0}} multiline numberOfLines={2} />
              </BlurView>
            </View>

            {/* Çalışma Saatleri */}
            <View style={styles.sectionMargin}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconAccent}><IconSymbol name="clock.fill" size={18} color="#ec4899" /></View>
                <Text style={styles.sectionTitle}>Çalışma Saatleri</Text>
              </View>
              <BlurView intensity={20} tint="dark" style={styles.sectionCard}>
                <View style={{flexDirection: 'row', gap: 16}}>
                  <Input label="Açılış" value={openingTime} onChangeText={setOpeningTime} placeholder="09:00" containerStyle={{flex: 1, marginBottom: 0}} />
                  <Input label="Kapanış" value={closingTime} onChangeText={setClosingTime} placeholder="23:00" containerStyle={{flex: 1, marginBottom: 0}} />
                </View>
              </BlurView>
            </View>

            {/* Fiyat & Kategori */}
            <View style={styles.sectionMargin}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconAccent}><IconSymbol name="tag.fill" size={18} color="#f59e0b" /></View>
                <Text style={styles.sectionTitle}>Fiyat Segmenti</Text>
              </View>
              <BlurView intensity={20} tint="dark" style={[styles.sectionCard, styles.priceContainerRow]}>
                {[1, 2, 3, 4].map((level) => (
                  <TouchableOpacity 
                    key={level} 
                    style={[styles.priceLevelBtn, priceRange === level && styles.priceLevelBtnActive]}
                    onPress={() => { lightImpact(); setPriceRange(level); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.priceLevelText, priceRange === level && styles.priceLevelTextActive]}>
                      {'₺'.repeat(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </BlurView>
            </View>

            {/* Kampanya ve Özellikler */}
            <View style={styles.sectionMargin}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconAccent}><IconSymbol name="sparkles" size={18} color="#fcd34d" /></View>
                <Text style={styles.sectionTitle}>Kampanya & Özellikler</Text>
              </View>
              <BlurView intensity={20} tint="dark" style={styles.sectionCard}>
                <Input label="Güncel Kampanya" value={campaign} onChangeText={setCampaign} placeholder="Örn: Hafta sonu kahveler %20 indirimli!" containerStyle={styles.inputContainer} />
                
                <Text style={styles.label}>Mekan Özellikleri</Text>
                {featureList.length > 0 && (
                  <View style={styles.featureChipsContainer}>
                    {featureList.map((feat, idx) => (
                      <View key={idx} style={styles.featureChip}>
                        <Text style={styles.featureChipText}>{feat}</Text>
                        <TouchableOpacity style={{paddingLeft: 6, paddingRight: 4}} onPress={() => { lightImpact(); setFeatureList(featureList.filter((_, i) => i !== idx)); }}>
                          <IconSymbol name="xmark" size={14} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={{flexDirection: 'row', gap: 10, alignItems: 'flex-start'}}>
                  <Input 
                    value={featureInput} 
                    onChangeText={setFeatureInput} 
                    placeholder="Örn: Wifi, Priz, Teras..." 
                    containerStyle={{flex: 1, marginBottom: 0}} 
                  />
                  <Button 
                    variant="secondary" 
                    style={{height: 52, paddingHorizontal: 20}} 
                    onPress={() => {
                      if (featureInput.trim().length > 0) {
                        lightImpact();
                        setFeatureList([...featureList, featureInput.trim()]);
                        setFeatureInput('');
                      }
                    }}
                  >Ekleye Bas</Button>
                </View>
                <Text style={styles.hintUnderInput}>Mekanınızdaki olanakları listeye teker teker ekleyin.</Text>
              </BlurView>
            </View>

            <View style={styles.actionContainer}>
              <Button variant="primary" onPress={handleSave} loading={saving} disabled={saving}>
                Değişiklikleri Kaydet
              </Button>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* --- MODALS --- */}

      {/* 1. MEDYA MODALI */}
      <Modal visible={showMediaModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <TouchableOpacity style={styles.modalOverlayCatcher} activeOpacity={1} onPress={() => setShowMediaModal(false)} />
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vitrin ve Medya</Text>
              <TouchableOpacity onPress={() => setShowMediaModal(false)} hitSlop={15}>
                <IconSymbol name="xmark.circle.fill" size={28} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 24 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Ana Kapak Görseli</Text>
              <Text style={styles.hintTextLeft}>Mekan profilinizin en üstünde yer alan ana vitrin fotoğrafıdır.</Text>
              <TouchableOpacity style={styles.coverPhotoBtn} onPress={pickImage} activeOpacity={0.8}>
                {coverPhoto ? (
                  <Image source={{ uri: coverPhoto }} style={styles.coverImagePreview} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <IconSymbol name="photo.badge.plus" size={40} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.placeholderText}>Görsel Yükle</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[styles.label, {marginTop: 36}]}>Galeri ve Medya Arşivi</Text>
              <Text style={styles.hintTextLeft}>Mekanınızın zengin galeri görüntüleri burada sergilenir.</Text>
              
              <View style={styles.galleryGrid}>
                {galleryImages.map((uri, idx) => (
                  <View key={idx} style={styles.galleryThumbnailWrapper}>
                    <Image source={{ uri }} style={styles.galleryThumbnail} resizeMode="cover" />
                    <TouchableOpacity 
                      style={styles.galleryRemoveBtn}
                      onPress={() => {
                        lightImpact();
                        setGalleryImages(galleryImages.filter((_, i) => i !== idx));
                      }}
                    >
                      <IconSymbol name="xmark" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity style={styles.galleryAddBtn} onPress={pickGalleryImage} activeOpacity={0.8}>
                  <IconSymbol name="plus" size={32} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Tanıtım Videosu</Text>
              <TouchableOpacity 
                style={styles.videoUploadBtn} 
                onPress={() => Alert.alert('Video Ekle', 'Kısa tanıtım videosu özellikleri çok yakında profesyoneller için açılacak.')}
                activeOpacity={0.8}
              >
                <IconSymbol name="video.badge.plus" size={28} color="#60a5fa" />
                <Text style={styles.videoUploadBtnText}>+ Video Ekle</Text>
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 2. MENU MODALI */}
      <Modal visible={showMenuModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <TouchableOpacity style={styles.modalOverlayCatcher} activeOpacity={1} onPress={() => setShowMenuModal(false)} />
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Menü Yönetimi</Text>
              <TouchableOpacity onPress={() => setShowMenuModal(false)} hitSlop={15}>
                <IconSymbol name="xmark.circle.fill" size={28} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* Segmented Control for Menu Type */}
            <View style={styles.menuModeTabs}>
              <TouchableOpacity
                style={[styles.menuModeTab, menuUploadType === 'text' && styles.menuModeTabActive]}
                onPress={() => { lightImpact(); setMenuUploadType('text'); }}
              >
                <IconSymbol name="list.bullet" size={16} color={menuUploadType === 'text' ? '#10b981' : 'rgba(255,255,255,0.5)'} />
                <Text style={[styles.menuModeTabText, menuUploadType === 'text' && styles.menuModeTabTextActive]}>Tek Tek Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuModeTab, menuUploadType === 'image' && styles.menuModeTabActive]}
                onPress={() => { lightImpact(); setMenuUploadType('image'); }}
              >
                <IconSymbol name="photo.fill" size={16} color={menuUploadType === 'image' ? '#10b981' : 'rgba(255,255,255,0.5)'} />
                <Text style={[styles.menuModeTabText, menuUploadType === 'image' && styles.menuModeTabTextActive]}>Fotoğraf Yükle</Text>
              </TouchableOpacity>
            </View>

            {menuUploadType === 'text' ? (
              <>
                <View style={styles.menuAddSection}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Input value={newMenuName} onChangeText={setNewMenuName} placeholder="Ürün Adı" containerStyle={{ flex: 2, marginBottom: 12 }} />
                    <Input value={newMenuPrice} onChangeText={setNewMenuPrice} placeholder="Fiyat (TL)" containerStyle={{ flex: 1, marginBottom: 12 }} keyboardType="numeric" />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Input value={newMenuCategory} onChangeText={setNewMenuCategory} placeholder="Kategori (Yemek, İçecek, Tatlı...)" containerStyle={{ flex: 2, marginBottom: 12 }} />
                  </View>
                  <Input value={newMenuDesc} onChangeText={setNewMenuDesc} placeholder="Ürün açıklaması (İsteğe bağlı)" containerStyle={{ marginBottom: 12 }} />
                  
                  {/* Ürün Görseli Seçici */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <TouchableOpacity style={styles.menuImgPickerBtn} onPress={pickMenuItemImage} activeOpacity={0.8}>
                      {newMenuImg ? (
                        <View style={{width: '100%', height: '100%'}}>
                          <Image source={{ uri: newMenuImg }} style={styles.menuImgPickerPreview} />
                          <TouchableOpacity
                            style={styles.menuImgRemoveBtn}
                            onPress={() => { lightImpact(); setNewMenuImg(null); }}
                            hitSlop={8}
                          >
                            <IconSymbol name="xmark" size={10} color="white" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{ alignItems: 'center' }}>
                          <IconSymbol name="photo.badge.plus" size={22} color="rgba(255,255,255,0.4)" />
                          <Text style={styles.menuImgPickerLabel}>Görsel</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, flex: 1 }}>
                      Ürün görseli eklemek menünüzün daha çekici görünmesini sağlar.
                    </Text>
                  </View>

                  <Button variant="secondary" style={{ borderColor: 'rgba(255,255,255,0.2)' }} onPress={addMenuItem}>+ Ürünü Menüye Ekle</Button>
                </View>
                <FlatList
                  data={menuItems}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 60 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.menuItemCard}>
                      <Image source={{ uri: item.img }} style={styles.menuItemImg} />
                      <View style={styles.menuItemInfo}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemDesc}>{item.desc}</Text>
                        {item.category ? (
                          <View style={{ flexDirection: 'row', marginTop: 4 }}>
                            <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: '700' }}>{item.category}</Text>
                            </View>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.menuItemPriceBadge}>
                        <Text style={styles.menuItemPrice}>{item.price}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.menuItemDeleteBtn}
                        onPress={() => { lightImpact(); setMenuItems(menuItems.filter(m => m.id !== item.id)); }}
                        hitSlop={8}
                      >
                        <IconSymbol name="trash" size={15} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                <Text style={styles.hintTextLeft}>
                  Fiziksel menünüzün fotoğraflarını çekip direkt yükleyebilirsiniz. Toplu ürün girmek istemiyorsanız en pratik yoldur.
                </Text>

                <View style={styles.menuPhotosGrid}>
                  {menuPhotos.map((uri, idx) => (
                    <View key={idx} style={styles.menuPhotoWrapper}>
                      <Image source={{ uri }} style={styles.menuPhotoPreview} />
                      <TouchableOpacity 
                        style={styles.menuPhotoRemoveBtn}
                        onPress={() => {
                          lightImpact();
                          setMenuPhotos(menuPhotos.filter((_, i) => i !== idx));
                        }}
                      >
                        <IconSymbol name="xmark" size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TouchableOpacity style={styles.menuPhotoAddBtn} onPress={pickMenuPhoto} activeOpacity={0.8}>
                    <IconSymbol name="doc.text.image" size={32} color="rgba(255,255,255,0.4)" />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: '600', fontSize: 13 }}>Sayfa Ekle</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. REVIEWS MODALI */}
      <Modal visible={showReviewsModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <TouchableOpacity style={styles.modalOverlayCatcher} activeOpacity={1} onPress={() => setShowReviewsModal(false)} />
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Müşteri Yorumları</Text>
              <TouchableOpacity onPress={() => setShowReviewsModal(false)} hitSlop={15}>
                <IconSymbol name="xmark.circle.fill" size={28} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {reviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewUserRow}>
                    <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                    <View style={{flex: 1}}>
                      <Text style={styles.reviewUserName}>{review.user}</Text>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                       <Text style={{ color: '#fcd34d', fontSize: 13, fontWeight: '700', letterSpacing: 2 }}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{`"${review.text}"`}</Text>

                  {review.reply ? (
                    <LinearGradient colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']} style={styles.reviewReplyBox}>
                      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                        <IconSymbol name="arrow.turn.down.right" size={14} color="#34d399" />
                        <Text style={{color: '#34d399', fontWeight: '800', fontSize: 13, marginLeft: 6}}>İşletme Yanıtınız</Text>
                      </View>
                      <Text style={{color: 'rgba(255,255,255,0.9)', lineHeight: 20}}>{review.reply}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <Input 
                        value={replyInputs[review.id] || ''} 
                        onChangeText={(txt) => setReplyInputs({...replyInputs, [review.id]: txt})} 
                        placeholder="Zarif bir şekilde yanıtla..." 
                        containerStyle={{ flex: 1, marginBottom: 0 }} 
                      />
                      <Button variant="primary" style={{ width: 80, height: 48 }} onPress={() => submitReply(review.id)}>İlet</Button>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  topGradientGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, zIndex: 0 },
  container: { padding: 24, paddingBottom: 140, paddingTop: 40 },
  header: { marginBottom: 36 },
  title: { fontSize: 34, fontWeight: '900', color: '#ffffff', marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22, fontWeight: '400' },
  
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  actionTile: { alignItems: 'center', borderRadius: 24, paddingVertical: 20, borderCurve: 'continuous' },
  actionIconRound: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTileText: { color: 'rgba(255,255,255,0.95)', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  notificationBadge: { position: 'absolute', top: 8, right: 12, backgroundColor: '#ef4444', minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#121212', paddingHorizontal: 6, zIndex: 10 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },

  statusToggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, shadowColor: '#10b981', shadowOffset: { width:0, height:0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  statusToggleText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  sectionMargin: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  iconAccent: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginLeft: 12, letterSpacing: -0.3 },
  sectionCard: { borderRadius: 24, padding: 20, paddingBottom: 20, borderCurve: 'continuous', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' },
  inputContainer: { marginBottom: 16 },
  hintUnderInput: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, marginLeft: 4, fontStyle: 'italic' },
  actionContainer: { marginTop: 12 },

  featureChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, marginTop: -4 },
  featureChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', paddingVertical: 8, paddingLeft: 14, paddingRight: 6, borderRadius: 20, borderCurve: 'continuous' },
  featureChipText: { color: '#60a5fa', fontSize: 14, fontWeight: '700' },

  priceContainerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  priceLevelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 4, borderWidth: 1, borderColor: 'transparent' },
  priceLevelBtnActive: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' },
  priceLevelText: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '800' },
  priceLevelTextActive: { color: '#fbbf24' },

  // Modals Look & Feel
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalOverlayCatcher: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { height: '85%', borderTopLeftRadius: 36, borderTopRightRadius: 36, borderCurve: 'continuous', padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderBottomWidth: 0, backgroundColor: 'rgba(20,20,20,0.8)' },
  modalDragIndicator: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalTitle: { fontSize: 26, fontWeight: '900', color: 'white', letterSpacing: -0.4 },
  label: { color: '#ffffff', fontSize: 17, fontWeight: '800', marginBottom: 12, letterSpacing: -0.2 },
  hintTextLeft: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  
  coverPhotoBtn: { width: '100%', height: 200, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, borderCurve: 'continuous', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' },
  coverImagePreview: { width: '100%', height: '100%' },
  placeholderText: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontWeight: '700', fontSize: 15 },
  
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  galleryThumbnailWrapper: { width: '30%', aspectRatio: 1, borderRadius: 16, borderCurve: 'continuous', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  galleryThumbnail: { width: '100%', height: '100%' },
  galleryRemoveBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  galleryAddBtn: { width: '30%', aspectRatio: 1, borderRadius: 16, borderCurve: 'continuous', backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' },

  videoUploadBtn: { flexDirection: 'row', backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: 18, borderRadius: 24, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  videoUploadBtnText: { color: '#60a5fa', marginLeft: 12, fontSize: 16, fontWeight: '800' },
  
  menuModeTabs: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 4, marginBottom: 20 },
  menuModeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
  menuModeTabActive: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  menuModeTabText: { color: 'rgba(255,255,255,0.5)', marginLeft: 8, fontWeight: '700', fontSize: 14 },
  menuModeTabTextActive: { color: '#10b981' },

  menuPhotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  menuPhotoWrapper: { width: '47%', aspectRatio: 0.75, borderRadius: 16, borderCurve: 'continuous', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  menuPhotoPreview: { width: '100%', height: '100%' },
  menuPhotoRemoveBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuPhotoAddBtn: { width: '47%', aspectRatio: 0.75, borderRadius: 16, borderCurve: 'continuous', backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' },

  menuAddSection: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 24, borderCurve: 'continuous', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  menuImgPickerBtn: { width: 80, height: 80, borderRadius: 18, borderCurve: 'continuous', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  menuImgPickerPreview: { width: '100%', height: '100%', borderRadius: 18 },
  menuImgPickerLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', marginTop: 4 },
  menuImgRemoveBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.65)', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  menuItemCard: { flexDirection: 'row', padding: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderCurve: 'continuous', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  menuItemImg: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)' },
  menuItemInfo: { flex: 1, marginHorizontal: 16 },
  menuItemName: { color: 'white', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  menuItemDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18 },
  menuItemPriceBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderCurve: 'continuous' },
  menuItemPrice: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  menuItemDeleteBtn: { marginLeft: 8, padding: 8 },
  
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderCurve: 'continuous', padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  reviewUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  reviewUserName: { color: 'white', fontSize: 16, fontWeight: '700' },
  reviewDate: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  reviewStars: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  reviewText: { color: 'rgba(255,255,255,0.95)', fontSize: 15, marginVertical: 8, fontStyle: 'italic', lineHeight: 22 },
  reviewReplyBox: { padding: 16, borderRadius: 16, borderCurve: 'continuous', marginTop: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
});
