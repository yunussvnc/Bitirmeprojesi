describe("ExploreWebMapView - District Filtering Logic", () => {
  const mockPlaces = [
    {
      id: 1,
      name: "Beşiktaş Coffee",
      address: "Cihannüma Mah. No:2, Beşiktaş/İstanbul",
      city: "İstanbul",
      category: "cafe",
      latitude: 41.042,
      longitude: 29.007,
    },
    {
      id: 2,
      name: "Kadıköy Bar",
      address: "Caferağa Mah. Moda Cd. No:102, Kadıköy",
      city: "İstanbul",
      category: "bar",
      latitude: 40.982,
      longitude: 29.027,
    },
    {
      id: 3,
      name: "Fatih Restaurant",
      address: "Hobyar Mah. Fatih",
      city: "İstanbul",
      category: "restaurant",
      latitude: 41.019,
      longitude: 28.949,
    },
  ];

  const mockDistricts = [
    { id: 'besiktas', apiLocation: 'Beşiktaş', lat: 41.042, lng: 29.007, aliases: ['beşiktaş', 'besiktas'] },
    { id: 'kadikoy', apiLocation: 'Kadıköy', lat: 40.982, lng: 29.027, aliases: ['kadıköy', 'kadikoy'] },
    { id: 'fatih', apiLocation: 'Fatih', lat: 41.019, lng: 28.949, aliases: ['fatih'] },
  ];

  const normalizeText = (text) => {
    return text
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i');
  };

  const placeMatchesDistrict = (place, district) => {
    const haystack = [
      place.city,
      place.address,
      place.name,
      place.subtitle,
    ]
      .filter(Boolean)
      .join(' ');

    return [district.apiLocation, ...district.aliases].some((term) =>
      normalizeText(haystack).includes(normalizeText(term)),
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const filterPlaces = (
    places,
    query,
    selectedCategories,
    selectedDistrict,
    userLocation,
    maxDistance
  ) => {
    const q = normalizeText(query.trim());
    return places.filter((p) => {
      // Metin arama
      if (q) {
        const haystack = [
          p.name,
          p.category,
          p.address,
          p.city,
          p.subtitle,
        ]
          .filter(Boolean)
          .join(' ');
        
        if (!normalizeText(haystack).includes(q)) return false;
      }
      // Kategori filtresi
      if (selectedCategories.length > 0) {
        if (!p.category || !selectedCategories.includes(p.category)) return false;
      }
      // İlçe filtresi
      if (selectedDistrict) {
        if (!placeMatchesDistrict(p, selectedDistrict)) {
          return false;
        }
      }
      // Mesafe filtresi (İlçe filtresi aktifse bypass et)
      if (!selectedDistrict && userLocation && p.latitude != null && p.longitude != null) {
        const distKm = calculateDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude) / 1000;
        if (distKm > maxDistance) return false;
      }
      return true;
    });
  };

  it("should return all places if no filter is active", () => {
    const results = filterPlaces(mockPlaces, "", [], null, null, 50);
    expect(results.length).toBe(3);
  });

  it("should filter places by selected district", () => {
    const besiktasDistrict = mockDistricts.find(d => d.id === "besiktas");
    const results = filterPlaces(mockPlaces, "", [], besiktasDistrict, null, 50);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Beşiktaş Coffee");
  });

  it("should bypass distance filter when district is active", () => {
    const besiktasDistrict = mockDistricts.find(d => d.id === "besiktas");
    // User location is far away (Kadıköy center)
    const userLocation = { latitude: 40.982, longitude: 29.027 };
    // Max distance is set to 2km (Beşiktaş is ~10km away)
    const results = filterPlaces(mockPlaces, "", [], besiktasDistrict, userLocation, 2);
    
    // It should still find Beşiktaş Coffee because distance filter is bypassed
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Beşiktaş Coffee");
  });

  it("should enforce distance filter when district is NOT active", () => {
    // User location is near Kadıköy
    const userLocation = { latitude: 40.982, longitude: 29.027 };
    // Max distance is set to 5km (Kadıköy Bar is close, Beşiktaş/Fatih are far away)
    const results = filterPlaces(mockPlaces, "", [], null, userLocation, 5);
    
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Kadıköy Bar");
  });
});
