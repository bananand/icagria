export const demoFarms = [
  {
    name: 'Sweet Potato Plot',
    location: {
      text: 'Bogor, West Java, Indonesia',
      lat: -6.595,
      lng: 106.817,
    },
    areaSize: 2,
    mainCropName: 'Sweet potato',
  },
  {
    name: 'Peanut Field',
    location: {
      text: 'Garut, West Java, Indonesia',
      lat: -7.213,
      lng: 107.909,
    },
    areaSize: 3,
    mainCropName: 'Peanut',
  },
];

export const demoListings = [
  {
    cropName: 'Sweet Potato',
    cropRefName: 'Sweet potato',
    quantity: 100,
    unit: 'kg',
    pricePerUnit: 8000,
    location: 'Bogor, West Java, Indonesia',
    status: 'available',
  },
  {
    cropName: 'Peanut',
    cropRefName: 'Peanut',
    quantity: 50,
    unit: 'kg',
    pricePerUnit: 25000,
    location: 'Garut, West Java, Indonesia',
    status: 'available',
  },
];

export const demoPlantings = [
  {
    farmName: 'Sweet Potato Plot',
    cropName: 'Sweet potato',
    variety: 'Local',
    daysAgoPlanted: 40,
  },
  {
    farmName: 'Sweet Potato Plot',
    cropName: 'Cassava',
    variety: 'Local',
    daysAgoPlanted: 60,
  },
  {
    farmName: 'Peanut Field',
    cropName: 'Peanut',
    variety: 'Local',
    daysAgoPlanted: 30,
  },
];
