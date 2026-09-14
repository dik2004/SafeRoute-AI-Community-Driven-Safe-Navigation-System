/**
 * SafeRoute Global Location Hierarchy Database
 * Structured as: Country -> State/Region -> City -> Place/Hub/Neighborhood -> Street/Avenue/Corridor
 */

export const LOCATION_HIERARCHY = [
  {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    emergencyNumber: '112 / 1091',
    states: [
      {
        stateCode: 'DL',
        stateName: 'Delhi (National Capital Region)',
        cities: [
          {
            cityName: 'New Delhi (Central & South)',
            isDefault: true,
            places: [
              {
                placeName: 'Connaught Place (CP)',
                type: 'Commercial & Transit Hub',
                icon: '🏛️',
                streets: [
                  {
                    streetName: 'Outer Circle Boulevard',
                    lat: 28.6289,
                    lng: 77.2065,
                    description: 'Well-lit pedestrian corridor with 24/7 CCTV and police patrols',
                    safetyTier: 'high',
                    lighting: 'High-Lumen Smart LED',
                    landmark: 'Near Central Park & Regal Crossing'
                  },
                  {
                    streetName: 'Inner Circle Pedestrian Corridor',
                    lat: 28.6304,
                    lng: 77.2177,
                    description: 'Broad colonnaded walkway with continuous security guards and cafes',
                    safetyTier: 'high',
                    lighting: 'Colonnade Continuous Lighting',
                    landmark: 'Blocks A to F Promenade'
                  },
                  {
                    streetName: 'Radial Road 3 & Janpath Crossing',
                    lat: 28.6265,
                    lng: 77.2185,
                    description: 'Active shopping avenue with high evening footfall',
                    safetyTier: 'high',
                    lighting: 'LED Streetlights',
                    landmark: 'Janpath Market & Metro Concourse'
                  },
                  {
                    streetName: 'Central Metro Station (Gate 2)',
                    lat: 28.6331,
                    lng: 77.2030,
                    description: 'Major transit interchange with women safety help desk and CISF monitoring',
                    safetyTier: 'high',
                    lighting: 'Transit Lumens 24/7',
                    landmark: 'Blue / Yellow Line Interchange'
                  }
                ]
              },
              {
                placeName: 'Hauz Khas & Green Park',
                type: 'Student & Heritage Corridor',
                icon: '🎓',
                streets: [
                  {
                    streetName: 'Sri Aurobindo Marg Safe Avenue',
                    lat: 28.5494,
                    lng: 77.2001,
                    description: 'Arterial boulevard connecting major university zones',
                    safetyTier: 'high',
                    lighting: 'Smart City High Mast',
                    landmark: 'Near Green Park Metro Gate 1'
                  },
                  {
                    streetName: 'Hauz Khas Village Main Gate Promenade',
                    lat: 28.5535,
                    lng: 77.1944,
                    description: 'High evening crowd density with private security presence',
                    safetyTier: 'moderate',
                    lighting: 'Heritage Warm LED',
                    landmark: 'Village Entrance Point'
                  },
                  {
                    streetName: 'IIT Delhi Campus Main Walkway',
                    lat: 28.5450,
                    lng: 77.1926,
                    description: 'Secure gated university campus corridor with ID checkpoints',
                    safetyTier: 'high',
                    lighting: 'Campus Security Poles',
                    landmark: 'IIT Gate 1 Security Booth'
                  }
                ]
              },
              {
                placeName: 'Defence Colony & South Extension',
                type: 'Residential & Lifestyle Center',
                icon: '🛍️',
                streets: [
                  {
                    streetName: 'Ring Road Service Lane Safe Walk',
                    lat: 28.5726,
                    lng: 77.2215,
                    description: 'Lit commercial strip with active open stores until 11 PM',
                    safetyTier: 'high',
                    lighting: 'Street Light Grid',
                    landmark: 'South Ext Part 1 Arcade'
                  },
                  {
                    streetName: 'Defence Colony Main Market Boulevard',
                    lat: 28.5744,
                    lng: 77.2319,
                    description: 'Vibrant neighborhood center with private neighborhood guards',
                    safetyTier: 'high',
                    lighting: 'Plaza Illumination',
                    landmark: 'Central Fountain Market Square'
                  }
                ]
              },
              {
                placeName: 'Dwarka Subcity',
                type: 'Modern Residential & Airport Link',
                icon: '✈️',
                streets: [
                  {
                    streetName: 'Dwarka Sector 21 Transit Hub Concourse',
                    lat: 28.5522,
                    lng: 77.0583,
                    description: 'Airport Express interchange with round-the-clock surveillance',
                    safetyTier: 'high',
                    lighting: 'Terminal Grade High-Lumen',
                    landmark: 'Airport Express Concourse'
                  },
                  {
                    streetName: 'Sector 12 City Center Walkway',
                    lat: 28.5921,
                    lng: 77.0402,
                    description: 'Broad arterial road near shopping mall and metro station',
                    safetyTier: 'high',
                    lighting: 'Dual Arm LED Poles',
                    landmark: 'City Center Mall Front'
                  }
                ]
              }
            ]
          },
          {
            cityName: 'Noida (Sector 18 & IT Corridor)',
            places: [
              {
                placeName: 'Sector 18 Commercial District',
                type: 'Shopping & Dining Hub',
                icon: '🏬',
                streets: [
                  {
                    streetName: 'Wave Silver Tower Promenade',
                    lat: 28.5708,
                    lng: 77.3261,
                    description: 'High footfall promenade with CCTV cameras and open restaurants',
                    safetyTier: 'high',
                    lighting: 'High Density LED',
                    landmark: 'Sector 18 Metro Gate 2'
                  },
                  {
                    streetName: 'Great India Place Walkway',
                    lat: 28.5678,
                    lng: 77.3255,
                    description: 'Mall perimeter with private security stations',
                    safetyTier: 'high',
                    lighting: 'Commercial High Mast',
                    landmark: 'Amusement Park Link'
                  }
                ]
              },
              {
                placeName: 'Sector 62 IT Park',
                type: 'Tech & University Zone',
                icon: '💻',
                streets: [
                  {
                    streetName: 'Electronic City Metro Concourse',
                    lat: 28.6280,
                    lng: 77.3755,
                    description: 'Corporate tech campus avenue with dedicated shuttle links',
                    safetyTier: 'high',
                    lighting: 'Smart Highway LED',
                    landmark: 'Noida Electronic City Metro'
                  }
                ]
              }
            ]
          },
          {
            cityName: 'Gurugram (Cyber City & Golf Course)',
            places: [
              {
                placeName: 'Cyber City & DLF Phase 2',
                type: 'Corporate Technology Hub',
                icon: '🏙️',
                streets: [
                  {
                    streetName: 'Cyber Hub Pedestrian Skywalk',
                    lat: 28.4950,
                    lng: 77.0890,
                    description: 'Dedicated pedestrian zone with 24/7 private security & medical desk',
                    safetyTier: 'high',
                    lighting: 'Architectural LED Corridor',
                    landmark: 'Building 10 Plaza'
                  },
                  {
                    streetName: 'Rapid Metro Phase 2 Link Road',
                    lat: 28.4908,
                    lng: 77.0934,
                    description: 'Illuminated corporate corridor with frequent transport options',
                    safetyTier: 'high',
                    lighting: 'Modern Streetlight Array',
                    landmark: 'Rapid Metro Station Concourse'
                  }
                ]
              },
              {
                placeName: 'Golf Course Road Corridor',
                type: 'Arterial Expressway Corridor',
                icon: '⛳',
                streets: [
                  {
                    streetName: 'Sector 54 Chowk Underpass Walk',
                    lat: 28.4410,
                    lng: 77.1082,
                    description: 'Modern pedestrian crossings with signalized lighting',
                    safetyTier: 'high',
                    lighting: 'CFL & LED Hybrid',
                    landmark: 'Sector 54 Rapid Metro'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'MH',
        stateName: 'Maharashtra',
        cities: [
          {
            cityName: 'Mumbai (South & Suburbs)',
            places: [
              {
                placeName: 'South Mumbai Heritage District',
                type: 'Waterfront & Historic Hub',
                icon: '🌊',
                streets: [
                  {
                    streetName: "Marine Drive Promenade (Queen's Necklace)",
                    lat: 18.9438,
                    lng: 72.8234,
                    description: 'World-famous 3km waterfront boulevard with 24/7 police presence & crowds',
                    safetyTier: 'high',
                    lighting: 'High-Density Sodium & LED',
                    landmark: 'Opposite Chowpatty & NCPA'
                  },
                  {
                    streetName: 'Churchgate Station Subway & Plaza',
                    lat: 18.9355,
                    lng: 72.8272,
                    description: 'Major railway terminus with constant commuter activity',
                    safetyTier: 'high',
                    lighting: 'Railway Concourse Floodlights',
                    landmark: 'Churchgate West Exit'
                  },
                  {
                    streetName: 'Gateway of India Waterfront Walk',
                    lat: 18.9220,
                    lng: 72.8347,
                    description: 'Tourist plaza with Navy & Mumbai Police post 24/7',
                    safetyTier: 'high',
                    lighting: 'Heritage High Mast',
                    landmark: 'Taj Mahal Palace Front'
                  }
                ]
              },
              {
                placeName: 'Bandra West (Queen of Suburbs)',
                type: 'Coastal & Cultural Center',
                icon: '🌴',
                streets: [
                  {
                    streetName: 'Bandra Bandstand Promenade',
                    lat: 19.0544,
                    lng: 72.8197,
                    description: 'Seaside walkway frequented by joggers with sea police beat',
                    safetyTier: 'high',
                    lighting: 'Coastal Solar LED',
                    landmark: 'Near Bandra Fort & Amphitheatre'
                  },
                  {
                    streetName: 'Linking Road Fashion Corridor',
                    lat: 19.0626,
                    lng: 72.8347,
                    description: 'Vibrant retail avenue with heavy evening foot traffic',
                    safetyTier: 'high',
                    lighting: 'Commercial Streetlights',
                    landmark: 'Waterfield Road Crossing'
                  },
                  {
                    streetName: 'Carter Road Coastal Strip',
                    lat: 19.0673,
                    lng: 72.8242,
                    description: 'Illuminated promenade with cafes and open spaces',
                    safetyTier: 'high',
                    lighting: 'Decorative LED Poles',
                    landmark: 'Carter Road Dog Park & Cafe Row'
                  }
                ]
              },
              {
                placeName: 'Bandra-Kurla Complex (BKC)',
                type: 'International Financial District',
                icon: '💼',
                streets: [
                  {
                    streetName: 'BKC G-Block Main Boulevard',
                    lat: 19.0662,
                    lng: 72.8687,
                    description: 'Wide planned avenues with dedicated corporate security surveillance',
                    safetyTier: 'high',
                    lighting: 'Smart City Intelligent Lights',
                    landmark: 'Jio World Centre & US Consulate'
                  }
                ]
              }
            ]
          },
          {
            cityName: 'Pune (Cultural & IT Hub)',
            places: [
              {
                placeName: 'Koregaon Park & Kalyani Nagar',
                type: 'Residential & Dining District',
                icon: '🌳',
                streets: [
                  {
                    streetName: 'North Main Road Corridor',
                    lat: 18.5362,
                    lng: 73.8940,
                    description: 'Tree-lined boulevard with cafes and high night foot traffic',
                    safetyTier: 'high',
                    lighting: 'Tree Canopy Ambient LED',
                    landmark: 'Lane 7 Junction'
                  }
                ]
              },
              {
                placeName: 'FC Road (Shivaji Nagar)',
                type: 'University & Youth Hub',
                icon: '🎓',
                streets: [
                  {
                    streetName: 'Fergusson College Road Avenue',
                    lat: 18.5236,
                    lng: 73.8415,
                    description: 'Famous student corridor with constant activity',
                    safetyTier: 'high',
                    lighting: 'High Mast City Lights',
                    landmark: 'Goodluck Chowk'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'KA',
        stateName: 'Karnataka',
        cities: [
          {
            cityName: 'Bengaluru (Bangalore)',
            places: [
              {
                placeName: 'Central Business District (CBD)',
                type: 'Shopping & Transit Hub',
                icon: '🏙️',
                streets: [
                  {
                    streetName: 'MG Road Metro Boulevard',
                    lat: 12.9756,
                    lng: 77.6066,
                    description: 'Elevated metro walkway with CCTV cameras and constant patrolling',
                    safetyTier: 'high',
                    lighting: 'Metro Lumens & LEDs',
                    landmark: 'MG Road Metro Station'
                  },
                  {
                    streetName: 'Church Street Cobblestone Walk',
                    lat: 12.9750,
                    lng: 77.6045,
                    description: 'Pedestrian-priority cobblestone street with bookstores & cafes',
                    safetyTier: 'high',
                    lighting: 'Boutique Street Lamps',
                    landmark: 'Blossom Book House Walk'
                  },
                  {
                    streetName: 'Brigade Road Retail Promenade',
                    lat: 12.9733,
                    lng: 77.6074,
                    description: 'One of the liveliest avenues with active traffic police booth',
                    safetyTier: 'high',
                    lighting: 'High-Intensity LED Grid',
                    landmark: 'Rex Theatre Junction'
                  }
                ]
              },
              {
                placeName: 'Indiranagar',
                type: 'Cosmopolitan Hub',
                icon: '✨',
                streets: [
                  {
                    streetName: '100 Feet Road Commercial Strip',
                    lat: 12.9719,
                    lng: 77.6412,
                    description: 'High-end retail avenue with wide walkways and constant traffic',
                    safetyTier: 'high',
                    lighting: 'Avenue Streetlights',
                    landmark: '12th Main Crossing'
                  },
                  {
                    streetName: '12th Main Road Corridor',
                    lat: 12.9698,
                    lng: 77.6390,
                    description: 'Safe neighborhood street with active restaurants',
                    safetyTier: 'high',
                    lighting: 'Residential LED Array',
                    landmark: 'Defence Colony Link'
                  }
                ]
              },
              {
                placeName: 'Koramangala (Startups & Colleges)',
                type: 'Student & Tech Zone',
                icon: '🚀',
                streets: [
                  {
                    streetName: '80 Feet Road Startup Corridor',
                    lat: 12.9352,
                    lng: 77.6245,
                    description: 'Active commercial strip connecting tech offices and residences',
                    safetyTier: 'high',
                    lighting: 'Continuous LED Poles',
                    landmark: 'Sony World Junction'
                  }
                ]
              },
              {
                placeName: 'Whitefield (Tech Hub)',
                type: 'IT Corridor',
                icon: '💻',
                streets: [
                  {
                    streetName: 'ITPL Main Road Safe Corridor',
                    lat: 12.9866,
                    lng: 77.7376,
                    description: 'Tech park boulevard with private corporate security cameras',
                    safetyTier: 'high',
                    lighting: 'Highway Standard High Mast',
                    landmark: 'ITPL Main Gate'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'TN',
        stateName: 'Tamil Nadu',
        cities: [
          {
            cityName: 'Chennai (Madras)',
            places: [
              {
                placeName: 'Marina & Santhome',
                type: 'Coastal Promenade',
                icon: '🌊',
                streets: [
                  {
                    streetName: 'Marina Beach Promenade Walk',
                    lat: 13.0500,
                    lng: 80.2824,
                    description: 'Second longest urban beach promenade with mounted police patrols',
                    safetyTier: 'high',
                    lighting: 'Coastal High Mast',
                    landmark: 'Near Lighthouse & Gandhi Statue'
                  }
                ]
              },
              {
                placeName: 'T. Nagar & Pondy Bazaar',
                type: 'Shopping District',
                icon: '🛍️',
                streets: [
                  {
                    streetName: 'Pondy Bazaar Pedestrian Plaza',
                    lat: 13.0418,
                    lng: 80.2341,
                    description: 'Dedicated pedestrian plaza with smart benches and surveillance',
                    safetyTier: 'high',
                    lighting: 'Smart Plaza LEDs',
                    landmark: 'Pondy Bazaar Central Walk'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'TS',
        stateName: 'Telangana',
        cities: [
          {
            cityName: 'Hyderabad (Cyberabad)',
            places: [
              {
                placeName: 'Hitec City & Gachibowli',
                type: 'IT & Financial District',
                icon: '💻',
                streets: [
                  {
                    streetName: 'Cyber Towers Junction Boulevard',
                    lat: 17.4504,
                    lng: 78.3808,
                    description: '24/7 IT corridor with women safety SHE Team patrol booths',
                    safetyTier: 'high',
                    lighting: 'High Lumen Smart City Lights',
                    landmark: 'Cyber Towers Concourse'
                  },
                  {
                    streetName: 'Mindspace IT Park Inner Loop',
                    lat: 17.4410,
                    lng: 78.3812,
                    description: 'Pedestrian-friendly tech park with extensive security monitoring',
                    safetyTier: 'high',
                    lighting: 'Campus Security Illuminators',
                    landmark: 'Raidurg Metro Gateway'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'WB',
        stateName: 'West Bengal',
        cities: [
          {
            cityName: 'Kolkata (Calcutta)',
            places: [
              {
                placeName: 'Park Street & Esplanade',
                type: 'Cultural & Historic Center',
                icon: '🏛️',
                streets: [
                  {
                    streetName: 'Park Street Illuminated Boulevard',
                    lat: 22.5535,
                    lng: 88.3524,
                    description: 'Famous dining and heritage boulevard with active Kolkata Police beat',
                    safetyTier: 'high',
                    lighting: 'Heritage Streetlamps & LEDs',
                    landmark: 'Flurys & Allen Park'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    emergencyNumber: '911',
    states: [
      {
        stateCode: 'NY',
        stateName: 'New York',
        cities: [
          {
            cityName: 'New York City',
            places: [
              {
                placeName: 'Manhattan (Midtown)',
                type: 'Commercial & Entertainment Core',
                icon: '🗽',
                streets: [
                  {
                    streetName: 'Times Square Pedestrian Plaza',
                    lat: 40.7580,
                    lng: -73.9855,
                    description: 'World famous 24/7 illuminated plaza with massive NYPD presence',
                    safetyTier: 'high',
                    lighting: 'Ultra High Digital Billboards & LEDs',
                    landmark: 'Broadway & 45th Street'
                  },
                  {
                    streetName: '5th Avenue & Rockefeller Center',
                    lat: 40.7587,
                    lng: -73.9787,
                    description: 'Prestigious shopping avenue with continuous foot traffic',
                    safetyTier: 'high',
                    lighting: 'Decorative High Mast Lights',
                    landmark: 'Rockefeller Plaza Walk'
                  },
                  {
                    streetName: 'Broadway & 42nd St Transit Corridor',
                    lat: 40.7559,
                    lng: -73.9866,
                    description: 'Subway hub connecting multiple train lines',
                    safetyTier: 'high',
                    lighting: 'High Lumen Streetlamps',
                    landmark: 'Bryant Park & Subway Concourse'
                  }
                ]
              },
              {
                placeName: 'Downtown Manhattan & SoHo',
                type: 'Arts & Historic District',
                icon: '🎨',
                streets: [
                  {
                    streetName: 'Broadway & Spring St Walkway',
                    lat: 40.7223,
                    lng: -73.9984,
                    description: 'Cast-iron district with lively retail and dining footfall',
                    safetyTier: 'high',
                    lighting: 'Street Grid Lighting',
                    landmark: 'Spring St Subway Station'
                  },
                  {
                    streetName: 'Washington Square Park South',
                    lat: 40.7308,
                    lng: -73.9973,
                    description: 'NYU Campus hub with active campus security patrols',
                    safetyTier: 'high',
                    lighting: 'Park Perimeter Lights',
                    landmark: 'NYU Kimmel Center Front'
                  }
                ]
              },
              {
                placeName: 'Brooklyn (DUMBO)',
                type: 'Waterfront Tech Hub',
                icon: '🌉',
                streets: [
                  {
                    streetName: 'DUMBO Waterfront Promenade',
                    lat: 40.7033,
                    lng: -73.9890,
                    description: 'Cobblestone streets with panoramic views of Manhattan bridge',
                    safetyTier: 'high',
                    lighting: 'Waterfront Lanterns',
                    landmark: 'Jane Carousel & Washington St'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'CA',
        stateName: 'California',
        cities: [
          {
            cityName: 'San Francisco',
            places: [
              {
                placeName: 'Financial District & SoMa',
                type: 'Tech & Financial District',
                icon: '🌁',
                streets: [
                  {
                    streetName: 'Market St & Powell St Plaza',
                    lat: 37.7844,
                    lng: -122.4079,
                    description: 'Major transit hub with BART/Muni and cable car turnaround',
                    safetyTier: 'high',
                    lighting: 'Transit Plaza Streetlights',
                    landmark: 'Powell St BART Station'
                  },
                  {
                    streetName: 'Embarcadero Ferry Building Promenade',
                    lat: 37.7955,
                    lng: -122.3937,
                    description: 'Bay-front promenade with joggers and constant daytime/evening foot traffic',
                    safetyTier: 'high',
                    lighting: 'Bayfront LED Lights',
                    landmark: 'Ferry Building Clock Tower'
                  }
                ]
              }
            ]
          },
          {
            cityName: 'Los Angeles',
            places: [
              {
                placeName: 'Santa Monica',
                type: 'Coastal Lifestyle Hub',
                icon: '🏖️',
                streets: [
                  {
                    streetName: '3rd Street Promenade',
                    lat: 34.0157,
                    lng: -118.4965,
                    description: 'Pedestrian-only 3-block outdoor shopping promenade with street performers',
                    safetyTier: 'high',
                    lighting: 'Tree Lights & High Mast',
                    landmark: 'Santa Monica Place Entrance'
                  },
                  {
                    streetName: 'Ocean Avenue Waterfront Walk',
                    lat: 34.0130,
                    lng: -118.4950,
                    description: 'Palisades Park border overlooking Santa Monica Pier',
                    safetyTier: 'high',
                    lighting: 'Palm Tree Lighting & City Poles',
                    landmark: 'Near Pier Bridge'
                  }
                ]
              },
              {
                placeName: 'Hollywood & Beverly Hills',
                type: 'Entertainment District',
                icon: '⭐',
                streets: [
                  {
                    streetName: 'Hollywood Boulevard Walk of Fame',
                    lat: 34.1016,
                    lng: -118.3268,
                    description: 'Tourist corridor with Chinese Theatre and Hollywood/Highland security',
                    safetyTier: 'high',
                    lighting: 'High Intensity City Lighting',
                    landmark: 'TCL Chinese Theatre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'TX',
        stateName: 'Texas',
        cities: [
          {
            cityName: 'Austin',
            places: [
              {
                placeName: 'Downtown Austin',
                type: 'Music & Tech Corridor',
                icon: '🎸',
                streets: [
                  {
                    streetName: 'Congress Avenue Historic Corridor',
                    lat: 30.2672,
                    lng: -97.7431,
                    description: 'Main avenue leading to State Capitol with wide sidewalks',
                    safetyTier: 'high',
                    lighting: 'Heritage Gaslamp-style LEDs',
                    landmark: 'Texas State Capitol View'
                  },
                  {
                    streetName: 'Lady Bird Lake Boardwalk Trail',
                    lat: 30.2520,
                    lng: -97.7280,
                    description: 'Illuminated boardwalk on the water with emergency call boxes',
                    safetyTier: 'high',
                    lighting: 'Solar Path Lighting',
                    landmark: 'South Shore Boardwalk'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'WA',
        stateName: 'Washington',
        cities: [
          {
            cityName: 'Seattle',
            places: [
              {
                placeName: 'Downtown & Waterfront',
                type: 'Market & Transit Hub',
                icon: '☕',
                streets: [
                  {
                    streetName: 'Pike Place Market Pedestrian Walk',
                    lat: 47.6097,
                    lng: -122.3422,
                    description: 'Historic public market with high pedestrian activity',
                    safetyTier: 'high',
                    lighting: 'Historic Market Fixtures',
                    landmark: 'Pike Place Clock & Fish Market'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    emergencyNumber: '999 / 112',
    states: [
      {
        stateCode: 'LDN',
        stateName: 'Greater London',
        cities: [
          {
            cityName: 'London',
            places: [
              {
                placeName: 'Westminster & West End',
                type: 'Shopping & Theatre Core',
                icon: '💂',
                streets: [
                  {
                    streetName: 'Oxford Street Shopping Strip',
                    lat: 51.5138,
                    lng: -0.1419,
                    description: 'Europe’s busiest shopping street with continuous Met Police patrols',
                    safetyTier: 'high',
                    lighting: 'Smart High-Lumen Streetlamps',
                    landmark: 'Oxford Circus Underground'
                  },
                  {
                    streetName: 'Regent Street & Piccadilly Circus',
                    lat: 51.5101,
                    lng: -0.1340,
                    description: 'Curved illuminated avenue with world-renowned digital billboards',
                    safetyTier: 'high',
                    lighting: 'Grand Architectural Lighting',
                    landmark: 'Piccadilly Lights & Eros Statue'
                  },
                  {
                    streetName: 'Covent Garden Piazza Pedestrian Zone',
                    lat: 51.5117,
                    lng: -0.1239,
                    description: 'Pedestrian plaza with street performers and indoor market halls',
                    safetyTier: 'high',
                    lighting: 'Piazza Festive Lights',
                    landmark: 'Apple Market Hall'
                  }
                ]
              },
              {
                placeName: 'South Bank & Waterloo',
                type: 'Cultural Riverside Walk',
                icon: '🎡',
                streets: [
                  {
                    streetName: 'Queen’s Walk South Bank Promenade',
                    lat: 51.5033,
                    lng: -0.1195,
                    description: 'Pedestrian riverside walk next to London Eye and National Theatre',
                    safetyTier: 'high',
                    lighting: 'Thames Riverfront Lamps',
                    landmark: 'London Eye & Jubilee Gardens'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'SCT',
        stateName: 'Scotland',
        cities: [
          {
            cityName: 'Edinburgh',
            places: [
              {
                placeName: 'Old Town & Royal Mile',
                type: 'Historic Castle Corridor',
                icon: '🏰',
                streets: [
                  {
                    streetName: 'Royal Mile Historic Promenade',
                    lat: 55.9500,
                    lng: -3.1890,
                    description: 'Cobblestone spine of Old Town with high tourist activity',
                    safetyTier: 'high',
                    lighting: 'Traditional Cast Iron Gas Lamps',
                    landmark: 'St Giles’ Cathedral'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    countryCode: 'FR',
    countryName: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    emergencyNumber: '112 / 17',
    states: [
      {
        stateCode: 'IDF',
        stateName: 'Île-de-France',
        cities: [
          {
            cityName: 'Paris',
            places: [
              {
                placeName: 'Central Paris (8th & 1st Arrondissement)',
                type: 'Iconic Grand Avenues',
                icon: '🗼',
                streets: [
                  {
                    streetName: 'Avenue des Champs-Élysées',
                    lat: 48.8698,
                    lng: 2.3075,
                    description: 'Broad grand boulevard lined with cinema, cafes, and luxury retail',
                    safetyTier: 'high',
                    lighting: 'Grand Avenue Golden Lights',
                    landmark: 'Arc de Triomphe to Concorde'
                  },
                  {
                    streetName: 'Rue de Rivoli Pedestrian Arcades',
                    lat: 48.8584,
                    lng: 2.3470,
                    description: 'Covered historic arcades next to the Louvre Museum',
                    safetyTier: 'high',
                    lighting: 'Arcade Ceiling Fixtures',
                    landmark: 'Louvre-Rivoli Metro'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    countryCode: 'JP',
    countryName: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    emergencyNumber: '110 / 119',
    states: [
      {
        stateCode: 'TK',
        stateName: 'Tokyo Prefecture',
        cities: [
          {
            cityName: 'Tokyo',
            places: [
              {
                placeName: 'Shibuya & Harajuku',
                type: 'Youth & Tech Center',
                icon: '🗾',
                streets: [
                  {
                    streetName: 'Shibuya Crossing & Hachiko Plaza',
                    lat: 35.6595,
                    lng: 139.7004,
                    description: 'World’s busiest pedestrian crossing with Koban police box at entrance',
                    safetyTier: 'high',
                    lighting: 'Ultra Bright Neon & HD Screens',
                    landmark: 'Shibuya Station Hachiko Gate'
                  },
                  {
                    streetName: 'Takeshita Street Pedestrian Lane',
                    lat: 35.6702,
                    lng: 139.7027,
                    description: 'Pedestrian-only fashion street with high crowd safety',
                    safetyTier: 'high',
                    lighting: 'Overhead Canopy Lights',
                    landmark: 'Harajuku Station Exit'
                  },
                  {
                    streetName: 'Omotesando Tree-Lined Boulevard',
                    lat: 35.6652,
                    lng: 139.7123,
                    description: 'Zelkova-tree lined avenue with upscale architectural illumination',
                    safetyTier: 'high',
                    lighting: 'Illuminated Trees & LED Poles',
                    landmark: 'Omotesando Hills'
                  }
                ]
              },
              {
                placeName: 'Shinjuku',
                type: 'Skyscraper & Transit Metropolis',
                icon: '🚅',
                streets: [
                  {
                    streetName: 'Shinjuku Station South Gate Walk',
                    lat: 35.6896,
                    lng: 139.7006,
                    description: 'World’s busiest railway station plaza with JR security patrols',
                    safetyTier: 'high',
                    lighting: 'Station Concourse 24/7 Lights',
                    landmark: 'NEWoMan South Concourse'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        stateCode: 'OS',
        stateName: 'Osaka Prefecture',
        cities: [
          {
            cityName: 'Osaka',
            places: [
              {
                placeName: 'Dotonbori & Namba',
                type: 'Canal & Culinary District',
                icon: '🦀',
                streets: [
                  {
                    streetName: 'Dotonbori Canal Walkway (Tonbori River Walk)',
                    lat: 34.6687,
                    lng: 135.5013,
                    description: 'Waterfront pedestrian boardwalk with famous Glico running man sign',
                    safetyTier: 'high',
                    lighting: 'Riverfront Neon Array',
                    landmark: 'Ebisu Bridge & Glico Sign'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    emergencyNumber: '999 / 901',
    states: [
      {
        stateCode: 'DXB',
        stateName: 'Emirate of Dubai',
        cities: [
          {
            cityName: 'Dubai',
            places: [
              {
                placeName: 'Downtown Dubai',
                type: 'Ultra-Modern City Core',
                icon: '✨',
                streets: [
                  {
                    streetName: 'Sheikh Mohammed bin Rashid Boulevard',
                    lat: 25.1972,
                    lng: 55.2744,
                    description: 'Palm-lined 3.5km loop around Burj Khalifa with Smart Police Stations (SPS)',
                    safetyTier: 'high',
                    lighting: 'Smart City High-Lumen Palms',
                    landmark: 'Burj Khalifa & Dubai Opera'
                  },
                  {
                    streetName: 'Dubai Mall Waterfront Promenade',
                    lat: 25.1985,
                    lng: 55.2796,
                    description: 'Fountain lake promenade with 24/7 surveillance and emergency help points',
                    safetyTier: 'high',
                    lighting: 'Fountain & Promenade Illumination',
                    landmark: 'Souk Al Bahar Bridge'
                  }
                ]
              },
              {
                placeName: 'Dubai Marina & JBR',
                type: 'Waterfront & Beach District',
                icon: '⛵',
                streets: [
                  {
                    streetName: 'The Walk at Jumeirah Beach Residence',
                    lat: 25.0772,
                    lng: 55.1325,
                    description: 'Pedestrian-friendly outdoor shopping & beachside promenade',
                    safetyTier: 'high',
                    lighting: 'Festive High-Mast LEDs',
                    landmark: 'Hilton JBR Front'
                  },
                  {
                    streetName: 'Marina Walk Pedestrian Strip',
                    lat: 25.0815,
                    lng: 55.1448,
                    description: '7km continuous waterfront walkway with cafes and security guards',
                    safetyTier: 'high',
                    lighting: 'Marina Dockside Lights',
                    landmark: 'Marina Mall Promenade'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    emergencyNumber: '000',
    states: [
      {
        stateCode: 'NSW',
        stateName: 'New South Wales',
        cities: [
          {
            cityName: 'Sydney',
            places: [
              {
                placeName: 'Sydney CBD & Circular Quay',
                type: 'Harbor & Transit Hub',
                icon: '🦘',
                streets: [
                  {
                    streetName: 'George Street Light Rail Boulevard',
                    lat: -33.8732,
                    lng: 151.2070,
                    description: 'Pedestrianized light rail boulevard with modern lighting and high foot traffic',
                    safetyTier: 'high',
                    lighting: 'Smart City Urban Lighting',
                    landmark: 'Town Hall & QVB Crossing'
                  },
                  {
                    streetName: 'Circular Quay Ferry Promenade',
                    lat: -33.8614,
                    lng: 151.2108,
                    description: 'Harbor promenade connecting ferry wharves and Opera House',
                    safetyTier: 'high',
                    lighting: 'Harbor Promenade Lamps',
                    landmark: 'Wharf 3 & Opera Walk'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    countryCode: 'SG',
    countryName: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    emergencyNumber: '999 / 995',
    states: [
      {
        stateCode: 'SG-CR',
        stateName: 'Central Region',
        cities: [
          {
            cityName: 'Singapore',
            places: [
              {
                placeName: 'Marina Bay & Downtown',
                type: 'Financial & Waterfront Core',
                icon: '🦁',
                streets: [
                  {
                    streetName: 'Marina Bay Sands Waterfront Boardwalk',
                    lat: 1.2838,
                    lng: 103.8591,
                    description: 'Ultra-safe waterfront wooden boardwalk with extensive camera network',
                    safetyTier: 'high',
                    lighting: 'Continuous Solar & Deck LEDs',
                    landmark: 'Event Plaza & Helix Bridge'
                  },
                  {
                    streetName: 'Orchard Road Shopping Boulevard',
                    lat: 1.3048,
                    lng: 103.8318,
                    description: 'Famous retail boulevard with underground concourses and high visibility',
                    safetyTier: 'high',
                    lighting: 'Illuminated Shopping Trees',
                    landmark: 'ION Orchard & Orchard MRT'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

// Helper functions for easy lookup and search
export function getAllCountries() {
  return LOCATION_HIERARCHY.map(c => ({
    countryCode: c.countryCode,
    countryName: c.countryName,
    flag: c.flag,
    emergencyNumber: c.emergencyNumber,
    statesCount: c.states.length
  }));
}

export function getStatesByCountry(countryCode) {
  const country = LOCATION_HIERARCHY.find(c => c.countryCode === countryCode || c.countryName.toLowerCase() === countryCode?.toLowerCase());
  return country ? country.states : [];
}

export function getCitiesByState(countryCode, stateCode) {
  const states = getStatesByCountry(countryCode);
  const state = states.find(s => s.stateCode === stateCode || s.stateName.toLowerCase() === stateCode?.toLowerCase());
  return state ? state.cities : [];
}

export function getPlacesByCity(countryCode, stateCode, cityName) {
  const cities = getCitiesByState(countryCode, stateCode);
  const city = cities.find(c => c.cityName === cityName || c.cityName.toLowerCase().includes(cityName?.toLowerCase()));
  return city ? city.places : [];
}

export function getStreetsByPlace(countryCode, stateCode, cityName, placeName) {
  const places = getPlacesByCity(countryCode, stateCode, cityName);
  const place = places.find(p => p.placeName === placeName || p.placeName.toLowerCase().includes(placeName?.toLowerCase()));
  return place ? place.streets : [];
}

/**
 * Universal full-text search across all countries, states, cities, places, and streets
 */
export function searchHierarchy(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = [];

  LOCATION_HIERARCHY.forEach(country => {
    country.states.forEach(state => {
      state.cities.forEach(city => {
        city.places.forEach(place => {
          place.streets.forEach(street => {
            const matchesStreet = street.streetName.toLowerCase().includes(q);
            const matchesPlace = place.placeName.toLowerCase().includes(q);
            const matchesCity = city.cityName.toLowerCase().includes(q);
            const matchesState = state.stateName.toLowerCase().includes(q);
            const matchesCountry = country.countryName.toLowerCase().includes(q);

            if (matchesStreet || matchesPlace || matchesCity || matchesState || matchesCountry) {
              results.push({
                country: country.countryName,
                flag: country.flag,
                state: state.stateName,
                city: city.cityName,
                place: place.placeName,
                street: street.streetName,
                fullName: `${street.streetName}, ${place.placeName}, ${city.cityName}, ${country.countryName}`,
                lat: street.lat,
                lng: street.lng,
                description: street.description,
                safetyTier: street.safetyTier,
                landmark: street.landmark
              });
            }
          });
        });
      });
    });
  });

  return results.slice(0, 10);
}
