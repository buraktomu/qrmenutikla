export type GalleryImage = {
  title: string;
  imageUrl: string;
};

export const COMMON_GALLERY: Record<string, GalleryImage[]> = {
  Kahve: [
    { title: 'Espresso', imageUrl: 'https://images.unsplash.com/photo-151097252790b-af4f902673a1?w=600&auto=format&fit=crop&q=80' },
    { title: 'Latte Art', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80' },
    { title: 'Türk Kahvesi', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
  ],
  Çay: [
    { title: 'Türk Çayı', imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80' },
    { title: 'Bitki Çayı', imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80' },
  ],
  'Soğuk İçecekler': [
    { title: 'Limonata', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80' },
    { title: 'Buzlu Kahve', imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80' },
  ],
  Burger: [
    { title: 'Klasik Cheeseburger', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
    { title: 'Tavuk Burger', imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80' },
  ],
  Pizza: [
    { title: 'Margarita Pizza', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
    { title: 'Karışık Pizza', imageUrl: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600&auto=format&fit=crop&q=80' },
  ],
  Tatlılar: [
    { title: 'Çikolatalı Sufle', imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80' },
    { title: 'Çilekli Waffle', imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop&q=80' },
    { title: 'San Sebastian Cheesecake', imageUrl: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=600&auto=format&fit=crop&q=80' },
  ],
  Sandviçler: [
    { title: 'Kulüp Sandviç', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
    { title: 'Ayvalık Tostu', imageUrl: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=600&auto=format&fit=crop&q=80' },
  ],
  Salatalar: [
    { title: 'Sezar Salata', imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80' },
    { title: 'Kinoa Kasesi', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80' },
  ],
  'Fast Food': [
    { title: 'Çıtır Patates Kızartması', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80' },
    { title: 'Soğan Halkaları', imageUrl: 'https://images.unsplash.com/photo-1639024471283-2bc7b3c6a267?w=600&auto=format&fit=crop&q=80' },
  ],
  'Ana Yemekler': [
    { title: 'Izgara Bonfile', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
    { title: 'Izgara Somon', imageUrl: 'https://images.unsplash.com/photo-1485962398605-ef6a4555418f?w=600&auto=format&fit=crop&q=80' },
  ],
};
