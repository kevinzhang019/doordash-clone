import Database from 'better-sqlite3';

export function seedDatabase(db: Database.Database) {
  const insertRestaurant = db.prepare(`
    INSERT INTO restaurants (name, cuisine, description, image_url, rating, delivery_fee, delivery_min, delivery_max, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (restaurant_id, category, name, description, price, image_url, is_available)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const seedAll = db.transaction(() => {
    // 1. Bella Napoli - Italian
    const bellaNapoli = insertRestaurant.run(
      'Bella Napoli',
      'Italian',
      'Authentic Neapolitan cuisine crafted with imported Italian ingredients. Our wood-fired pizzas and handmade pastas bring the flavors of Naples to your doorstep.',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      4.8,
      2.99,
      25,
      40,
      '701 Columbus Ave, San Francisco, CA 94133'
    );
    const bellaId = bellaNapoli.lastInsertRowid as number;

    // Antipasti
    insertMenuItem.run(bellaId, 'Antipasti', 'Bruschetta al Pomodoro', 'Grilled bread topped with fresh tomatoes, basil, garlic, and extra virgin olive oil', 8.99, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80');
    insertMenuItem.run(bellaId, 'Antipasti', 'Burrata e Prosciutto', 'Creamy burrata cheese served with thinly sliced prosciutto di Parma and arugula', 14.99, 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80');
    insertMenuItem.run(bellaId, 'Antipasti', 'Calamari Fritti', 'Crispy fried calamari with marinara dipping sauce and a squeeze of lemon', 12.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80');

    // Pizza
    insertMenuItem.run(bellaId, 'Pizza', 'Margherita DOP', 'San Marzano tomatoes, fresh fior di latte mozzarella, fresh basil, extra virgin olive oil', 16.99, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80');
    insertMenuItem.run(bellaId, 'Pizza', 'Diavola', 'Tomato sauce, mozzarella, spicy Calabrian salami, fresh chili, and oregano', 18.99, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80');
    insertMenuItem.run(bellaId, 'Pizza', 'Quattro Stagioni', 'Tomato, mozzarella, artichokes, olives, mushrooms, and cooked ham in four sections', 19.99, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80');
    insertMenuItem.run(bellaId, 'Pizza', 'Tartufo Bianco', 'White pizza with truffle cream, wild mushrooms, mozzarella, and fresh thyme', 22.99, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80');

    // Pasta
    insertMenuItem.run(bellaId, 'Pasta', 'Spaghetti alla Carbonara', 'Spaghetti with guanciale, eggs, Pecorino Romano, and black pepper', 17.99, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80');
    insertMenuItem.run(bellaId, 'Pasta', 'Pappardelle al Ragù', 'Wide egg noodles with slow-braised beef and pork ragù, Parmigiano-Reggiano', 19.99, 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80');
    insertMenuItem.run(bellaId, 'Pasta', 'Rigatoni all\'Amatriciana', 'Rigatoni with tomato sauce, guanciale, Pecorino Romano, and red chili flakes', 17.99, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80');

    // Desserts
    insertMenuItem.run(bellaId, 'Desserts', 'Tiramisù Classico', 'Classic tiramisu with ladyfingers soaked in espresso, mascarpone cream, and cocoa', 8.99, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80');
    insertMenuItem.run(bellaId, 'Desserts', 'Panna Cotta', 'Silky vanilla panna cotta with fresh berry coulis and mint', 7.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');
    insertMenuItem.run(bellaId, 'Desserts', 'Cannoli Siciliani', 'Crispy pastry shells filled with sweetened ricotta, chocolate chips, and candied orange peel', 7.99, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80');

    // 2. Sakura Garden - Japanese
    const sakura = insertRestaurant.run(
      'Sakura Garden',
      'Japanese',
      'Exquisite Japanese cuisine featuring the freshest fish for sushi, traditional ramen, and seasonal specialties prepared by our master chef trained in Tokyo.',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
      4.7,
      3.99,
      30,
      50,
      '1737 Post St, San Francisco, CA 94115'
    );
    const sakuraId = sakura.lastInsertRowid as number;

    // Appetizers
    insertMenuItem.run(sakuraId, 'Appetizers', 'Edamame', 'Steamed young soybeans lightly salted with sea salt', 5.99, 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=400&q=80');
    insertMenuItem.run(sakuraId, 'Appetizers', 'Gyoza (6 pcs)', 'Pan-fried pork and cabbage dumplings with ponzu dipping sauce', 8.99, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80');
    insertMenuItem.run(sakuraId, 'Appetizers', 'Agedashi Tofu', 'Lightly battered silken tofu in a dashi broth with grated daikon and green onion', 9.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80');
    insertMenuItem.run(sakuraId, 'Appetizers', 'Karaage Chicken', 'Japanese fried chicken marinated in soy sauce and ginger, served with kewpie mayo', 11.99, 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80');

    // Sushi & Rolls
    insertMenuItem.run(sakuraId, 'Sushi & Rolls', 'Dragon Roll (8 pcs)', 'Shrimp tempura, avocado, cucumber topped with avocado and unagi sauce', 16.99, 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&q=80');
    insertMenuItem.run(sakuraId, 'Sushi & Rolls', 'Salmon Nigiri (2 pcs)', 'Fresh Atlantic salmon over seasoned sushi rice', 7.99, 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80');
    insertMenuItem.run(sakuraId, 'Sushi & Rolls', 'Spicy Tuna Roll (8 pcs)', 'Fresh tuna with spicy mayo, cucumber, and sesame seeds', 13.99, 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&q=80');
    insertMenuItem.run(sakuraId, 'Sushi & Rolls', 'Rainbow Roll (8 pcs)', 'California roll topped with tuna, salmon, yellowtail, and avocado', 18.99, 'https://images.unsplash.com/photo-1617196034099-b65e8e9e5a5e?w=400&q=80');

    // Main Dishes
    insertMenuItem.run(sakuraId, 'Main Dishes', 'Tonkotsu Ramen', 'Rich pork bone broth, chashu pork, soft-boiled egg, nori, bamboo shoots, and green onion', 16.99, 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80');
    insertMenuItem.run(sakuraId, 'Main Dishes', 'Chicken Katsu Curry', 'Crispy breaded chicken cutlet with Japanese curry sauce and steamed rice', 17.99, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80');
    insertMenuItem.run(sakuraId, 'Main Dishes', 'Beef Teriyaki', 'Grilled beef with sweet teriyaki glaze, served with steamed rice and miso soup', 19.99, 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&q=80');

    // Desserts
    insertMenuItem.run(sakuraId, 'Desserts', 'Mochi Ice Cream (3 pcs)', 'Soft rice cake filled with ice cream — choose from matcha, strawberry, or mango', 7.99, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80');
    insertMenuItem.run(sakuraId, 'Desserts', 'Matcha Cheesecake', 'Creamy Japanese-style cheesecake with premium ceremonial grade matcha', 8.99, 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=400&q=80');

    // 3. Casa Fuego - Mexican
    const casaFuego = insertRestaurant.run(
      'Casa Fuego',
      'Mexican',
      'Vibrant Mexican street food and traditional dishes made with authentic recipes passed down through generations. Fresh ingredients, bold flavors, and fiery salsas.',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
      4.6,
      1.99,
      20,
      35,
      '2889 Mission St, San Francisco, CA 94110'
    );
    const casaId = casaFuego.lastInsertRowid as number;

    // Starters
    insertMenuItem.run(casaId, 'Starters', 'Guacamole & Chips', 'Fresh avocado mashed with lime, cilantro, jalapeño, and tomato, served with crispy tortilla chips', 9.99, 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=400&q=80');
    insertMenuItem.run(casaId, 'Starters', 'Queso Fundido', 'Melted Chihuahua cheese with chorizo and roasted poblano, served with warm flour tortillas', 11.99, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&q=80');
    insertMenuItem.run(casaId, 'Starters', 'Elote en Vaso', 'Mexican street corn kernels with mayo, cotija cheese, chili powder, and lime juice', 7.99, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80');

    // Tacos
    insertMenuItem.run(casaId, 'Tacos', 'Tacos al Pastor (3)', 'Marinated pork with pineapple, onion, cilantro on corn tortillas with salsa verde', 13.99, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80');
    insertMenuItem.run(casaId, 'Tacos', 'Tacos de Carnitas (3)', 'Slow-braised pulled pork with pickled red onion, jalapeño, and fresh cilantro', 13.99, 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&q=80');
    insertMenuItem.run(casaId, 'Tacos', 'Fish Tacos (3)', 'Beer-battered cod with cabbage slaw, chipotle crema, and pico de gallo on corn tortillas', 14.99, 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400&q=80');
    insertMenuItem.run(casaId, 'Tacos', 'Tacos de Birria (3)', 'Braised beef in consommé-dipped tortillas, Oaxacan cheese, cilantro, and dipping consommé', 15.99, 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=400&q=80');

    // Burritos & Bowls
    insertMenuItem.run(casaId, 'Burritos & Bowls', 'Burrito Supremo', 'Large flour tortilla filled with carne asada, rice, black beans, pico, guacamole, and sour cream', 14.99, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80');
    insertMenuItem.run(casaId, 'Burritos & Bowls', 'Pollo Bowl', 'Grilled chicken over cilantro-lime rice with black beans, corn salsa, guacamole, and cheese', 13.99, 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=400&q=80');
    insertMenuItem.run(casaId, 'Burritos & Bowls', 'Veggie Burrito', 'Roasted peppers, mushrooms, black beans, rice, guacamole, and salsa verde in a spinach tortilla', 12.99, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80');

    // Desserts
    insertMenuItem.run(casaId, 'Desserts', 'Churros con Chocolate', 'Crispy cinnamon-sugar churros with rich Mexican chocolate dipping sauce', 7.99, 'https://images.unsplash.com/photo-1626198226928-8e9b25e9e5e6?w=400&q=80');
    insertMenuItem.run(casaId, 'Desserts', 'Tres Leches Cake', 'Sponge cake soaked in three milks, topped with whipped cream and fresh strawberries', 8.99, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80');

    // 4. Spice Route - Indian
    const spiceRoute = insertRestaurant.run(
      'Spice Route',
      'Indian',
      'A culinary journey through India\'s diverse regional cuisines. From the creamy kormas of the North to the fiery vindaloos of Goa, every dish is crafted with freshly ground spices.',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
      4.7,
      2.49,
      30,
      50,
      "533 O'Farrell St, San Francisco, CA 94102"
    );
    const spiceId = spiceRoute.lastInsertRowid as number;

    // Appetizers
    insertMenuItem.run(spiceId, 'Appetizers', 'Samosa Chaat (4 pcs)', 'Crispy potato-pea samosas topped with tamarind chutney, yogurt, and sev', 8.99, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80');
    insertMenuItem.run(spiceId, 'Appetizers', 'Chicken Tikka (6 pcs)', 'Tender chicken marinated in yogurt and spices, chargrilled in the tandoor', 12.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80');
    insertMenuItem.run(spiceId, 'Appetizers', 'Paneer Tikka (6 pcs)', 'Cubes of paneer marinated in spiced yogurt, grilled with peppers and onions', 11.99, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80');

    // Curries
    insertMenuItem.run(spiceId, 'Curries', 'Butter Chicken', 'Tender chicken in a velvety tomato-cream sauce with aromatic spices. Mildly spiced.', 16.99, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80');
    insertMenuItem.run(spiceId, 'Curries', 'Lamb Rogan Josh', 'Slow-cooked Kashmiri lamb curry with whole spices and caramelized onions. Medium heat.', 18.99, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80');
    insertMenuItem.run(spiceId, 'Curries', 'Palak Paneer', 'Fresh cottage cheese in a spiced spinach gravy. Vegetarian.', 14.99, 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8ad7?w=400&q=80');
    insertMenuItem.run(spiceId, 'Curries', 'Prawn Masala', 'Jumbo prawns in a tangy tomato-onion masala with coastal spices. Medium-hot.', 19.99, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80');

    // Rice & Breads
    insertMenuItem.run(spiceId, 'Rice & Breads', 'Chicken Biryani', 'Fragrant basmati rice layered with spiced chicken, saffron, caramelized onions, and herbs', 17.99, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80');
    insertMenuItem.run(spiceId, 'Rice & Breads', 'Garlic Naan', 'Tandoor-baked leavened bread brushed with garlic butter and fresh cilantro', 3.99, 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&q=80');
    insertMenuItem.run(spiceId, 'Rice & Breads', 'Lamb Keema Paratha', 'Flaky whole wheat flatbread stuffed with spiced minced lamb, served with raita', 9.99, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80');

    // Desserts
    insertMenuItem.run(spiceId, 'Desserts', 'Gulab Jamun (4 pcs)', 'Soft milk-solid dumplings soaked in rose-cardamom sugar syrup', 6.99, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&q=80');
    insertMenuItem.run(spiceId, 'Desserts', 'Kulfi Falooda', 'Dense pistachio ice cream over vermicelli noodles with rose syrup and basil seeds', 7.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');

    // 5. Golden Dragon - Chinese
    const goldenDragon = insertRestaurant.run(
      'Golden Dragon',
      'Chinese',
      'Traditional Chinese cuisine spanning Cantonese dim sum, Sichuan specialties, and Cantonese seafood dishes. Family recipes perfected over three generations.',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
      4.5,
      1.99,
      25,
      40,
      '744 Washington St, San Francisco, CA 94108'
    );
    const dragonId = goldenDragon.lastInsertRowid as number;

    // Dim Sum
    insertMenuItem.run(dragonId, 'Dim Sum', 'Har Gow (4 pcs)', 'Steamed shrimp dumplings in translucent rice flour wrappers', 7.99, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80');
    insertMenuItem.run(dragonId, 'Dim Sum', 'Siu Mai (4 pcs)', 'Open-top steamed pork and shrimp dumplings with mushroom', 7.99, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80');
    insertMenuItem.run(dragonId, 'Dim Sum', 'BBQ Pork Bao (3 pcs)', 'Fluffy steamed buns filled with sweet Cantonese char siu pork', 8.99, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80');

    // Soups & Starters
    insertMenuItem.run(dragonId, 'Soups & Starters', 'Hot & Sour Soup', 'Classic Sichuan soup with tofu, mushrooms, bamboo shoots, egg, and black vinegar', 8.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80');
    insertMenuItem.run(dragonId, 'Soups & Starters', 'Spring Rolls (4 pcs)', 'Crispy rolls filled with pork, cabbage, and glass noodles with sweet chili sauce', 8.99, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80');
    insertMenuItem.run(dragonId, 'Soups & Starters', 'Wonton Soup', 'Pork and shrimp wontons in a clear ginger-chicken broth with bok choy', 9.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80');

    // Main Dishes
    insertMenuItem.run(dragonId, 'Main Dishes', 'Kung Pao Chicken', 'Diced chicken with peanuts, dried chilies, and Sichuan peppercorns in a spicy-sweet sauce', 15.99, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80');
    insertMenuItem.run(dragonId, 'Main Dishes', 'Peking Duck (half)', 'Roasted duck with crispy lacquered skin, served with pancakes, hoisin, and cucumber', 32.99, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80');
    insertMenuItem.run(dragonId, 'Main Dishes', 'Mapo Tofu', 'Silken tofu and ground pork in an intensely spicy and numbing Sichuan bean sauce', 13.99, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80');
    insertMenuItem.run(dragonId, 'Main Dishes', 'Beef with Broccoli', 'Tender sliced beef and broccoli in a savory oyster sauce with garlic', 15.99, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80');

    // Noodles & Rice
    insertMenuItem.run(dragonId, 'Noodles & Rice', 'Yang Chow Fried Rice', 'Wok-fried rice with shrimp, char siu pork, eggs, and green onions', 12.99, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80');
    insertMenuItem.run(dragonId, 'Noodles & Rice', 'Dan Dan Noodles', 'Wheat noodles in a spicy Sichuan sesame sauce with ground pork, peanuts, and preserved vegetables', 13.99, 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80');
    insertMenuItem.run(dragonId, 'Noodles & Rice', 'Beef Chow Fun', 'Wide rice noodles stir-fried with beef, bean sprouts, and green onions in a soy-based sauce', 14.99, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80');

    // 6. Le Petit Bistro - French
    const lePetit = insertRestaurant.run(
      'Le Petit Bistro',
      'French',
      'A charming Parisian bistro bringing classic French cuisine to your table. From delicate starters to rich cassoulet, our chef sources only the finest ingredients.',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
      4.9,
      4.99,
      35,
      55,
      '345 Powell St, San Francisco, CA 94102'
    );
    const frenchId = lePetit.lastInsertRowid as number;

    // Entrées
    insertMenuItem.run(frenchId, 'Entrées', 'Soupe à l\'Oignon', 'Classic French onion soup with caramelized onions, beef broth, croutons, and melted Gruyère', 12.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80');
    insertMenuItem.run(frenchId, 'Entrées', 'Escargots de Bourgogne', 'Burgundy snails baked in garlic-herb butter, served in their shells with crusty baguette', 15.99, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80');
    insertMenuItem.run(frenchId, 'Entrées', 'Salade Niçoise', 'Tuna, hard-boiled egg, haricots verts, olives, tomatoes, and anchovies with Dijon vinaigrette', 14.99, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80');

    // Plats Principaux
    insertMenuItem.run(frenchId, 'Plats Principaux', 'Steak Frites', '8oz bavette steak with crispy pommes frites and house-made béarnaise sauce', 28.99, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80');
    insertMenuItem.run(frenchId, 'Plats Principaux', 'Bouillabaisse', 'Traditional Marseille fish stew with saffron, fennel, assorted seafood, and rouille toasts', 34.99, 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80');
    insertMenuItem.run(frenchId, 'Plats Principaux', 'Boeuf Bourguignon', 'Slow-braised beef in Burgundy wine with pearl onions, mushrooms, and bacon lardons', 29.99, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80');
    insertMenuItem.run(frenchId, 'Plats Principaux', 'Sole Meunière', 'Lemon sole pan-fried in brown butter with capers, lemon, and fresh parsley', 31.99, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80');

    // Fromages
    insertMenuItem.run(frenchId, 'Fromages', 'Plateau de Fromages', 'Selection of three French cheeses with honeycomb, walnuts, grapes, and artisan crackers', 18.99, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80');

    // Desserts
    insertMenuItem.run(frenchId, 'Desserts', 'Crème Brûlée', 'Silky vanilla custard with a perfectly caramelized sugar crust', 9.99, 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&q=80');
    insertMenuItem.run(frenchId, 'Desserts', 'Tarte Tatin', 'Upside-down caramelized apple tart with flaky pastry, served warm with crème fraîche', 10.99, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80');
    insertMenuItem.run(frenchId, 'Desserts', 'Chocolate Fondant', 'Warm dark chocolate lava cake with a molten center, served with vanilla bean ice cream', 11.99, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80');

    // 7. Olive & Sea - Mediterranean
    const oliveSea = insertRestaurant.run(
      'Olive & Sea',
      'Mediterranean',
      'Sun-drenched Mediterranean flavors from Greece, Lebanon, and Turkey. Fresh seafood, vibrant mezze, and wood-fired grills inspired by the azure Mediterranean coast.',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
      4.6,
      2.99,
      25,
      45,
      '2246 Chestnut St, San Francisco, CA 94123'
    );
    const medId = oliveSea.lastInsertRowid as number;

    // Mezze
    insertMenuItem.run(medId, 'Mezze', 'Hummus & Pita', 'Creamy chickpea hummus with olive oil, paprika, and warm house-made pita bread', 8.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80');
    insertMenuItem.run(medId, 'Mezze', 'Mezze Platter', 'Hummus, baba ganoush, tzatziki, falafel, tabbouleh, olives, and warm pita for two', 18.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(medId, 'Mezze', 'Spanakopita (4 pcs)', 'Crispy phyllo pastry triangles filled with spinach, feta, and fresh herbs', 9.99, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80');
    insertMenuItem.run(medId, 'Mezze', 'Kibbeh (4 pcs)', 'Crispy bulgur shells filled with spiced ground lamb, pine nuts, and onions', 11.99, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80');

    // Seafood
    insertMenuItem.run(medId, 'Seafood', 'Grilled Whole Branzino', 'Mediterranean sea bass grilled with lemon, herbs, and olive oil, served with roasted vegetables', 28.99, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80');
    insertMenuItem.run(medId, 'Seafood', 'Shrimp Saganaki', 'Jumbo shrimp baked in a spiced tomato sauce with feta cheese and fresh herbs', 22.99, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80');
    insertMenuItem.run(medId, 'Seafood', 'Calamari Grillé', 'Chargrilled whole calamari with chimichurri-style herb sauce and lemon wedges', 19.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80');

    // Grills
    insertMenuItem.run(medId, 'Grills', 'Lamb Souvlaki', 'Skewers of marinated lamb with tzatziki, tomatoes, and warm pita', 22.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(medId, 'Grills', 'Mixed Grill Platter', 'Chicken kebab, lamb kofta, and beef adana with grilled vegetables and rice pilaf', 27.99, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80');
    insertMenuItem.run(medId, 'Grills', 'Falafel Bowl', 'Crispy chickpea falafel over saffron rice with hummus, tabbouleh, and tahini dressing', 14.99, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80');

    // Desserts
    insertMenuItem.run(medId, 'Desserts', 'Baklava (4 pcs)', 'Honey-soaked layers of crispy phyllo with pistachios and walnuts', 8.99, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80');
    insertMenuItem.run(medId, 'Desserts', 'Greek Yogurt with Honey', 'Thick strained yogurt drizzled with Thyme honey, walnuts, and figs', 7.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');

    // 8. Seoul Kitchen - Korean
    const seoulKitchen = insertRestaurant.run(
      'Seoul Kitchen',
      'Korean',
      'Authentic Korean cuisine from classic BBQ to modern Korean-fusion dishes. We serve the soul of Seoul — from comforting stews to the thrill of tabletop grilling.',
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80',
      4.7,
      2.99,
      25,
      45,
      '308 5th Ave, San Francisco, CA 94118'
    );
    const seoulId = seoulKitchen.lastInsertRowid as number;

    // Appetizers
    insertMenuItem.run(seoulId, 'Appetizers', 'Pajeon (Korean Scallion Pancake)', 'Crispy savory pancake with scallions, seafood, and a soy-sesame dipping sauce', 10.99, 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80');
    insertMenuItem.run(seoulId, 'Appetizers', 'Japchae', 'Stir-fried glass noodles with beef, spinach, mushrooms, and carrots in a sesame sauce', 12.99, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80');
    insertMenuItem.run(seoulId, 'Appetizers', 'Tteokbokki', 'Chewy rice cakes in a spicy-sweet gochujang sauce with fish cakes and scallions', 10.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80');

    // BBQ
    insertMenuItem.run(seoulId, 'BBQ', 'Bulgogi', 'Thinly sliced marinated beef with soy, pear, garlic, and sesame, chargrilled to perfection', 19.99, 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&q=80');
    insertMenuItem.run(seoulId, 'BBQ', 'Galbi (Short Ribs)', 'Marinated bone-in beef short ribs with a sweet-savory soy glaze', 24.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(seoulId, 'BBQ', 'Samgyeopsal (Pork Belly)', 'Thick-cut pork belly grilled at the table with ssam vegetables and gochujang', 21.99, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80');

    // Rice & Noodles
    insertMenuItem.run(seoulId, 'Rice & Noodles', 'Bibimbap', 'Stone pot rice bowl with sautéed vegetables, gochujang, a fried egg, and your choice of protein', 16.99, 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80');
    insertMenuItem.run(seoulId, 'Rice & Noodles', 'Budae Jjigae (Army Stew)', 'Spicy Korean stew with ramen noodles, spam, sausage, tofu, and kimchi', 17.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80');
    insertMenuItem.run(seoulId, 'Rice & Noodles', 'Doenjang Jjigae', 'Hearty fermented soybean paste stew with tofu, zucchini, and mushrooms, served with rice', 14.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80');

    // Desserts
    insertMenuItem.run(seoulId, 'Desserts', 'Bingsu (Shaved Ice)', 'Korean shaved ice dessert with sweet red beans, mochi, and condensed milk. Choice of strawberry or matcha.', 9.99, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80');
    insertMenuItem.run(seoulId, 'Desserts', 'Hotteok (Sweet Pancake)', 'Warm stuffed pancakes filled with brown sugar, cinnamon, and crushed peanuts', 6.99, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80');

    // 9. Thai Orchid - Thai
    const thaiOrchid = insertRestaurant.run(
      'Thai Orchid',
      'Thai',
      'Authentic Thai cuisine bursting with fragrant herbs and bold flavors. Our dishes balance the five pillars of Thai cooking: sweet, sour, salty, spicy, and umami.',
      'https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&q=80',
      4.6,
      2.49,
      25,
      40,
      '1234 Irving St, San Francisco, CA 94122'
    );
    const thaiId = thaiOrchid.lastInsertRowid as number;

    // Starters
    insertMenuItem.run(thaiId, 'Starters', 'Satay Chicken (6 skewers)', 'Grilled chicken skewers marinated in coconut milk and turmeric, with peanut sauce and cucumber relish', 11.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80');
    insertMenuItem.run(thaiId, 'Starters', 'Spring Rolls Tod (4 pcs)', 'Crispy vegetable spring rolls with glass noodles and sweet chili dipping sauce', 8.99, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80');
    insertMenuItem.run(thaiId, 'Starters', 'Miang Kham', 'Traditional Thai snack of betel leaves with ginger, lime, peanuts, coconut, and sweet palm sauce', 9.99, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80');

    // Soups & Salads
    insertMenuItem.run(thaiId, 'Soups & Salads', 'Tom Yum Goong', 'Spicy and sour lemongrass broth with tiger prawns, mushrooms, galangal, and kaffir lime', 13.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80');
    insertMenuItem.run(thaiId, 'Soups & Salads', 'Tom Kha Gai', 'Creamy coconut milk soup with chicken, galangal, lemongrass, mushrooms, and lime', 12.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80');
    insertMenuItem.run(thaiId, 'Soups & Salads', 'Som Tum (Papaya Salad)', 'Shredded green papaya with cherry tomatoes, green beans, peanuts, and a spicy lime dressing', 10.99, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80');

    // Curries & Stir-Fries
    insertMenuItem.run(thaiId, 'Curries & Stir-Fries', 'Green Curry with Chicken', 'Aromatic green curry paste with chicken, bamboo shoots, Thai eggplant, and Thai basil in coconut milk', 15.99, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80');
    insertMenuItem.run(thaiId, 'Curries & Stir-Fries', 'Massaman Beef Curry', 'Rich slow-cooked beef curry with potatoes, peanuts, and warm spices in a thick coconut sauce', 17.99, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80');
    insertMenuItem.run(thaiId, 'Curries & Stir-Fries', 'Pad Thai with Shrimp', 'Stir-fried rice noodles with shrimp, bean sprouts, egg, peanuts, and tamarind sauce', 14.99, 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80');
    insertMenuItem.run(thaiId, 'Curries & Stir-Fries', 'Basil Stir-Fry (Pad Kra Pao)', 'Wok-fried minced pork with fresh Thai basil, chili, and oyster sauce, topped with a crispy egg', 13.99, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&q=80');

    // Desserts
    insertMenuItem.run(thaiId, 'Desserts', 'Mango Sticky Rice', 'Sweet jasmine sticky rice with fresh Alphonso mango, coconut cream, and sesame seeds', 8.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');
    insertMenuItem.run(thaiId, 'Desserts', 'Thai Tea Panna Cotta', 'Creamy panna cotta infused with Thai iced tea, topped with condensed milk', 7.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');

    // 10. The American Grill - American
    const americanGrill = insertRestaurant.run(
      'The American Grill',
      'American',
      'Classic American comfort food done right. Premium burgers, smoked BBQ ribs, and all-day breakfast favorites. Big portions, bold flavors, and everything made from scratch.',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      4.4,
      0.99,
      20,
      35,
      '555 Mission St, San Francisco, CA 94105'
    );
    const americanId = americanGrill.lastInsertRowid as number;

    // Starters
    insertMenuItem.run(americanId, 'Starters', 'Buffalo Wings (10 pcs)', 'Crispy chicken wings tossed in classic buffalo sauce, served with blue cheese dip and celery', 14.99, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80');
    insertMenuItem.run(americanId, 'Starters', 'Loaded Potato Skins (6 pcs)', 'Crispy potato skins with cheddar cheese, bacon bits, sour cream, and chives', 12.99, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80');
    insertMenuItem.run(americanId, 'Starters', 'Onion Rings', 'Beer-battered Vidalia onion rings with smoky chipotle ranch dipping sauce', 8.99, 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=400&q=80');
    insertMenuItem.run(americanId, 'Starters', 'Mac & Cheese Bites (8 pcs)', 'Crispy panko-breaded mac and cheese balls with four-cheese filling', 10.99, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80');

    // Burgers & Sandwiches
    insertMenuItem.run(americanId, 'Burgers & Sandwiches', 'Classic Smash Burger', 'Double smashed beef patties with American cheese, caramelized onions, pickles, mustard, and ketchup on a brioche bun', 14.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80');
    insertMenuItem.run(americanId, 'Burgers & Sandwiches', 'BBQ Bacon Burger', 'Angus beef patty with crispy bacon, cheddar, fried onion strings, and BBQ sauce', 16.99, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80');
    insertMenuItem.run(americanId, 'Burgers & Sandwiches', 'Crispy Chicken Sandwich', 'Fried chicken breast with pickle, coleslaw, and hot honey on a toasted brioche bun', 14.99, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80');
    insertMenuItem.run(americanId, 'Burgers & Sandwiches', 'Philly Cheesesteak', 'Shaved ribeye steak with provolone, sautéed onions and peppers on a fresh hoagie roll', 16.99, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80');

    // Mains
    insertMenuItem.run(americanId, 'Mains', 'BBQ Baby Back Ribs (Half Rack)', 'Slow-smoked pork ribs with house dry rub and tangy BBQ sauce, served with coleslaw and cornbread', 24.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(americanId, 'Mains', 'NY Strip Steak (12oz)', 'USDA choice beef, seasoned and grilled to your liking, with mashed potatoes and seasonal vegetables', 34.99, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80');
    insertMenuItem.run(americanId, 'Mains', 'Chicken & Waffles', 'Southern fried chicken thighs on a Belgian waffle with maple syrup and hot sauce', 17.99, 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80');

    // Desserts
    insertMenuItem.run(americanId, 'Desserts', 'New York Cheesecake', 'Dense and creamy classic cheesecake with a graham cracker crust and fresh berry compote', 8.99, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80');
    insertMenuItem.run(americanId, 'Desserts', 'Warm Chocolate Brownie', 'Fudgy dark chocolate brownie with a scoop of vanilla ice cream and hot fudge sauce', 8.99, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80');
    insertMenuItem.run(americanId, 'Desserts', 'Apple Pie à la Mode', 'Warm cinnamon apple pie with flaky crust, served with vanilla ice cream', 7.99, 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=400&q=80');
  });

  seedAll();
}

export function seedMenuItemOptions(db: Database.Database) {
  const insertGroup = db.prepare(`
    INSERT INTO menu_item_option_groups (menu_item_id, name, required, max_selections, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertOption = db.prepare(`
    INSERT INTO menu_item_options (group_id, name, price_modifier, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  function itemId(itemName: string, restaurantName: string): number | null {
    const row = db.prepare(`
      SELECT mi.id FROM menu_items mi
      JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE mi.name = ? AND r.name = ?
    `).get(itemName, restaurantName) as { id: number } | undefined;
    return row?.id ?? null;
  }

  type Opt = { name: string; price: number };
  function addGroup(
    itemName: string, restaurantName: string,
    groupName: string, required: boolean, maxSel: number | null, sortOrder: number,
    opts: Opt[]
  ) {
    const id = itemId(itemName, restaurantName);
    if (!id) return;
    const g = insertGroup.run(id, groupName, required ? 1 : 0, maxSel, sortOrder);
    const gid = g.lastInsertRowid as number;
    opts.forEach((o, i) => insertOption.run(gid, o.name, o.price, i + 1));
  }

  const seed = db.transaction(() => {

    // ===== 1. BELLA NAPOLI =====
    addGroup('Bruschetta al Pomodoro', 'Bella Napoli', 'Add-ons', false, null, 1, [
      { name: 'Add Burrata', price: 3.00 },
      { name: 'Add Prosciutto di Parma', price: 3.00 },
      { name: 'Extra Basil', price: 0.00 },
    ]);

    addGroup('Burrata e Prosciutto', 'Bella Napoli', 'Add-ons', false, null, 1, [
      { name: 'Extra Prosciutto', price: 3.00 },
      { name: 'Add Truffle Honey Drizzle', price: 2.00 },
      { name: 'Add Grilled Peaches', price: 2.00 },
    ]);

    addGroup('Calamari Fritti', 'Bella Napoli', 'Dipping Sauce', true, 1, 1, [
      { name: 'Marinara', price: 0.00 },
      { name: 'Garlic Aioli', price: 0.00 },
      { name: 'Spicy Arrabbiata', price: 0.00 },
    ]);

    for (const pizza of ['Margherita DOP', 'Diavola', 'Quattro Stagioni', 'Tartufo Bianco']) {
      addGroup(pizza, 'Bella Napoli', 'Size', true, 1, 1, [
        { name: 'Personal (10")', price: 0.00 },
        { name: 'Large (14")', price: 6.00 },
      ]);
    }
    addGroup('Margherita DOP', 'Bella Napoli', 'Extra Toppings', false, null, 2, [
      { name: 'Extra Mozzarella', price: 2.00 },
      { name: 'Add Prosciutto', price: 3.00 },
      { name: 'Add Mushrooms', price: 2.00 },
      { name: 'Add Fresh Chili', price: 0.00 },
    ]);
    addGroup('Diavola', 'Bella Napoli', 'Heat Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Diavola', 'Bella Napoli', 'Extra Toppings', false, null, 3, [
      { name: 'Extra Salami', price: 2.00 },
      { name: 'Extra Mozzarella', price: 2.00 },
    ]);
    addGroup('Tartufo Bianco', 'Bella Napoli', 'Extra Toppings', false, null, 2, [
      { name: 'Extra Truffle Cream', price: 4.00 },
      { name: 'Extra Wild Mushrooms', price: 2.00 },
    ]);

    addGroup('Spaghetti alla Carbonara', 'Bella Napoli', 'Pasta Shape', true, 1, 1, [
      { name: 'Spaghetti', price: 0.00 },
      { name: 'Rigatoni', price: 0.00 },
      { name: 'Fettuccine', price: 0.00 },
    ]);
    addGroup('Spaghetti alla Carbonara', 'Bella Napoli', 'Add-ons', false, null, 2, [
      { name: 'Extra Guanciale', price: 3.00 },
      { name: 'Extra Pecorino Romano', price: 1.00 },
    ]);
    addGroup('Pappardelle al Ragù', 'Bella Napoli', 'Add-ons', false, null, 1, [
      { name: 'Extra Parmigiano-Reggiano', price: 1.00 },
      { name: 'Add Burrata', price: 3.00 },
    ]);
    addGroup('Rigatoni all\'Amatriciana', 'Bella Napoli', 'Heat Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Rigatoni all\'Amatriciana', 'Bella Napoli', 'Add-ons', false, null, 2, [
      { name: 'Extra Guanciale', price: 2.00 },
      { name: 'Extra Pecorino Romano', price: 1.00 },
    ]);

    addGroup('Panna Cotta', 'Bella Napoli', 'Sauce', true, 1, 1, [
      { name: 'Berry Coulis', price: 0.00 },
      { name: 'Caramel', price: 0.00 },
      { name: 'Dark Chocolate', price: 0.00 },
    ]);
    addGroup('Cannoli Siciliani', 'Bella Napoli', 'Quantity', false, 1, 1, [
      { name: '3 pieces (as made)', price: 0.00 },
      { name: '6 pieces', price: 7.00 },
    ]);
    addGroup('Tiramisù Classico', 'Bella Napoli', 'Add-ons', false, null, 1, [
      { name: 'Extra Espresso Drizzle', price: 0.00 },
      { name: 'Add Whipped Cream', price: 1.00 },
    ]);

    // ===== 2. SAKURA GARDEN =====
    addGroup('Edamame', 'Sakura Garden', 'Seasoning', true, 1, 1, [
      { name: 'Sea Salt', price: 0.00 },
      { name: 'Garlic Butter', price: 0.00 },
      { name: 'Spicy Sesame', price: 0.00 },
    ]);

    addGroup('Gyoza (6 pcs)', 'Sakura Garden', 'Cooking Style', true, 1, 1, [
      { name: 'Pan-fried', price: 0.00 },
      { name: 'Steamed', price: 0.00 },
    ]);
    addGroup('Gyoza (6 pcs)', 'Sakura Garden', 'Quantity', false, 1, 2, [
      { name: '6 pieces (as made)', price: 0.00 },
      { name: '12 pieces', price: 8.00 },
    ]);
    addGroup('Gyoza (6 pcs)', 'Sakura Garden', 'Add-ons', false, null, 3, [
      { name: 'Add Chili Oil', price: 0.00 },
    ]);

    addGroup('Karaage Chicken', 'Sakura Garden', 'Sauce', true, 1, 1, [
      { name: 'Kewpie Mayo', price: 0.00 },
      { name: 'Spicy Mayo', price: 0.00 },
      { name: 'Ponzu', price: 0.00 },
    ]);
    addGroup('Karaage Chicken', 'Sakura Garden', 'Make it a Meal', true, 1, 2, [
      { name: 'Karaage only', price: 0.00 },
      { name: 'Add Steamed Rice + Miso Soup', price: 5.00 },
    ]);

    addGroup('Dragon Roll (8 pcs)', 'Sakura Garden', 'Sauce', true, 1, 1, [
      { name: 'Unagi Sauce', price: 0.00 },
      { name: 'Spicy Mayo', price: 0.00 },
      { name: 'Both', price: 0.00 },
    ]);
    addGroup('Dragon Roll (8 pcs)', 'Sakura Garden', 'Add-ons', false, null, 2, [
      { name: 'Add Tobiko', price: 2.00 },
      { name: 'Extra Avocado', price: 1.00 },
    ]);

    addGroup('Salmon Nigiri (2 pcs)', 'Sakura Garden', 'Quantity', false, 1, 1, [
      { name: '2 pieces (as made)', price: 0.00 },
      { name: '4 pieces', price: 7.00 },
      { name: '6 pieces', price: 13.00 },
    ]);

    addGroup('Spicy Tuna Roll (8 pcs)', 'Sakura Garden', 'Heat Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Spicy Tuna Roll (8 pcs)', 'Sakura Garden', 'Add-ons', false, null, 2, [
      { name: 'Add Tobiko', price: 2.00 },
    ]);

    addGroup('Rainbow Roll (8 pcs)', 'Sakura Garden', 'Add-ons', false, null, 1, [
      { name: 'Add Tobiko', price: 2.00 },
      { name: 'Extra Avocado', price: 2.00 },
    ]);

    addGroup('Tonkotsu Ramen', 'Sakura Garden', 'Broth Richness', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Rich (kotteri)', price: 0.00 },
      { name: 'Light (assari)', price: 0.00 },
    ]);
    addGroup('Tonkotsu Ramen', 'Sakura Garden', 'Noodle Firmness', true, 1, 2, [
      { name: 'Regular', price: 0.00 },
      { name: 'Firm (kata)', price: 0.00 },
      { name: 'Extra Firm (harigane)', price: 0.00 },
    ]);
    addGroup('Tonkotsu Ramen', 'Sakura Garden', 'Spice', true, 1, 3, [
      { name: 'No spice', price: 0.00 },
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Spicy', price: 0.00 },
    ]);
    addGroup('Tonkotsu Ramen', 'Sakura Garden', 'Extra Toppings', false, null, 4, [
      { name: 'Extra Chashu Pork', price: 4.00 },
      { name: 'Extra Soft-Boiled Egg', price: 2.00 },
      { name: 'Extra Nori', price: 1.00 },
      { name: 'Extra Bamboo Shoots', price: 1.00 },
    ]);

    addGroup('Chicken Katsu Curry', 'Sakura Garden', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Chicken Katsu Curry', 'Sakura Garden', 'Add-ons', false, null, 2, [
      { name: 'Extra Curry Sauce', price: 2.00 },
      { name: 'Extra Steamed Rice', price: 2.00 },
    ]);

    addGroup('Beef Teriyaki', 'Sakura Garden', 'Protein', true, 1, 1, [
      { name: 'Beef', price: 0.00 },
      { name: 'Chicken', price: 0.00 },
      { name: 'Salmon', price: 3.00 },
    ]);
    addGroup('Beef Teriyaki', 'Sakura Garden', 'Add-ons', false, null, 2, [
      { name: 'Add Miso Soup', price: 3.00 },
      { name: 'Extra Teriyaki Sauce', price: 0.00 },
    ]);

    addGroup('Mochi Ice Cream (3 pcs)', 'Sakura Garden', 'Flavor', true, 1, 1, [
      { name: 'Matcha', price: 0.00 },
      { name: 'Strawberry', price: 0.00 },
      { name: 'Mango', price: 0.00 },
      { name: 'Red Bean', price: 0.00 },
    ]);
    addGroup('Mochi Ice Cream (3 pcs)', 'Sakura Garden', 'Quantity', false, 1, 2, [
      { name: '3 pieces (as made)', price: 0.00 },
      { name: '6 pieces', price: 7.00 },
    ]);

    addGroup('Matcha Cheesecake', 'Sakura Garden', 'Add-ons', false, null, 1, [
      { name: 'Add Vanilla Ice Cream', price: 3.00 },
      { name: 'Add Whipped Cream', price: 1.00 },
    ]);

    // ===== 3. CASA FUEGO =====
    addGroup('Guacamole & Chips', 'Casa Fuego', 'Heat Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Guacamole & Chips', 'Casa Fuego', 'Add-ons', false, null, 2, [
      { name: 'Extra Chips', price: 2.00 },
      { name: 'Extra Guacamole', price: 3.00 },
      { name: 'Add Salsa Roja', price: 1.00 },
    ]);

    addGroup('Queso Fundido', 'Casa Fuego', 'Chorizo', false, 1, 1, [
      { name: 'With Chorizo (as made)', price: 0.00 },
      { name: 'Extra Chorizo', price: 2.00 },
      { name: 'Without Chorizo', price: 0.00 },
    ]);
    addGroup('Queso Fundido', 'Casa Fuego', 'Add-ons', false, null, 2, [
      { name: 'Extra Flour Tortillas', price: 2.00 },
    ]);

    addGroup('Elote en Vaso', 'Casa Fuego', 'Heat Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Elote en Vaso', 'Casa Fuego', 'Add-ons', false, null, 2, [
      { name: 'Extra Cotija Cheese', price: 1.00 },
      { name: 'Extra Lime', price: 0.00 },
    ]);

    for (const taco of ['Tacos al Pastor (3)', 'Tacos de Carnitas (3)', 'Fish Tacos (3)']) {
      addGroup(taco, 'Casa Fuego', 'Salsa', true, 1, 1, [
        { name: 'Salsa Verde', price: 0.00 },
        { name: 'Salsa Roja', price: 0.00 },
        { name: 'Both', price: 0.00 },
      ]);
      addGroup(taco, 'Casa Fuego', 'Upgrade to 6 Tacos', false, 1, 2, [
        { name: '3 tacos (as made)', price: 0.00 },
        { name: '6 tacos', price: 11.00 },
      ]);
      addGroup(taco, 'Casa Fuego', 'Add-ons', false, null, 3, [
        { name: 'Add Guacamole', price: 2.00 },
      ]);
    }
    addGroup('Fish Tacos (3)', 'Casa Fuego', 'Heat Level', true, 1, 4, [
      { name: 'Regular Chipotle Crema', price: 0.00 },
      { name: 'Extra Spicy Crema', price: 0.00 },
    ]);
    addGroup('Tacos de Birria (3)', 'Casa Fuego', 'Upgrade to 6 Tacos', false, 1, 1, [
      { name: '3 tacos (as made)', price: 0.00 },
      { name: '6 tacos', price: 13.00 },
    ]);
    addGroup('Tacos de Birria (3)', 'Casa Fuego', 'Add-ons', false, null, 2, [
      { name: 'Extra Consommé', price: 1.00 },
      { name: 'Extra Oaxacan Cheese', price: 2.00 },
      { name: 'Add Guacamole', price: 2.00 },
    ]);

    addGroup('Burrito Supremo', 'Casa Fuego', 'Protein', true, 1, 1, [
      { name: 'Carne Asada', price: 0.00 },
      { name: 'Pollo Asado', price: 0.00 },
      { name: 'Carnitas', price: 0.00 },
      { name: 'Veggie', price: -2.00 },
    ]);
    addGroup('Burrito Supremo', 'Casa Fuego', 'Size', false, 1, 2, [
      { name: 'Regular (as made)', price: 0.00 },
      { name: 'XL', price: 3.00 },
    ]);
    addGroup('Burrito Supremo', 'Casa Fuego', 'Add-ons', false, null, 3, [
      { name: 'Extra Guacamole', price: 2.00 },
      { name: 'Add Jalapeños', price: 0.00 },
      { name: 'Extra Sour Cream', price: 1.00 },
    ]);

    addGroup('Pollo Bowl', 'Casa Fuego', 'Protein', true, 1, 1, [
      { name: 'Grilled Chicken', price: 0.00 },
      { name: 'Carne Asada', price: 2.00 },
      { name: 'Carnitas', price: 1.00 },
      { name: 'Tofu', price: -1.00 },
    ]);
    addGroup('Pollo Bowl', 'Casa Fuego', 'Add-ons', false, null, 2, [
      { name: 'Extra Guacamole', price: 2.00 },
      { name: 'Add Jalapeños', price: 0.00 },
      { name: 'Extra Cheese', price: 1.00 },
    ]);

    addGroup('Veggie Burrito', 'Casa Fuego', 'Tortilla', true, 1, 1, [
      { name: 'Spinach Tortilla', price: 0.00 },
      { name: 'Flour Tortilla', price: 0.00 },
      { name: 'Whole Wheat Tortilla', price: 0.00 },
    ]);
    addGroup('Veggie Burrito', 'Casa Fuego', 'Add-ons', false, null, 2, [
      { name: 'Add Cheese', price: 1.00 },
      { name: 'Add Sour Cream', price: 1.00 },
      { name: 'Add Guacamole', price: 2.00 },
    ]);

    addGroup('Churros con Chocolate', 'Casa Fuego', 'Dipping Sauce', true, 1, 1, [
      { name: 'Mexican Chocolate', price: 0.00 },
      { name: 'Caramel', price: 0.00 },
      { name: 'Both', price: 0.00 },
    ]);
    addGroup('Churros con Chocolate', 'Casa Fuego', 'Portion', false, 1, 2, [
      { name: 'Regular (as made)', price: 0.00 },
      { name: 'Double Portion', price: 6.00 },
    ]);

    addGroup('Tres Leches Cake', 'Casa Fuego', 'Add-ons', false, null, 1, [
      { name: 'Extra Fresh Berries', price: 2.00 },
      { name: 'Add Caramel Drizzle', price: 1.00 },
    ]);

    // ===== 4. SPICE ROUTE =====
    addGroup('Samosa Chaat (4 pcs)', 'Spice Route', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Samosa Chaat (4 pcs)', 'Spice Route', 'Add-ons', false, null, 2, [
      { name: 'Extra Tamarind Chutney', price: 1.00 },
      { name: 'Add Raita', price: 1.00 },
    ]);

    for (const tikka of ['Chicken Tikka (6 pcs)', 'Paneer Tikka (6 pcs)']) {
      addGroup(tikka, 'Spice Route', 'Spice Level', true, 1, 1, [
        { name: 'Mild', price: 0.00 },
        { name: 'Medium', price: 0.00 },
        { name: 'Hot', price: 0.00 },
        { name: 'Extra Hot', price: 0.00 },
      ]);
      addGroup(tikka, 'Spice Route', 'Make it a Meal', true, 1, 2, [
        { name: 'Tikka only', price: 0.00 },
        { name: 'Add Garlic Naan + Raita', price: 6.00 },
      ]);
      addGroup(tikka, 'Spice Route', 'Add-ons', false, null, 3, [
        { name: 'Add Mint Chutney', price: 1.00 },
        { name: 'Add Raita', price: 2.00 },
      ]);
    }

    for (const curry of ['Butter Chicken', 'Lamb Rogan Josh', 'Palak Paneer', 'Prawn Masala']) {
      addGroup(curry, 'Spice Route', 'Spice Level', true, 1, 1, [
        { name: 'Mild', price: 0.00 },
        { name: 'Medium', price: 0.00 },
        { name: 'Hot', price: 0.00 },
        { name: 'Extra Hot', price: 0.00 },
      ]);
      addGroup(curry, 'Spice Route', 'Accompaniment', true, 1, 2, [
        { name: 'Curry only', price: 0.00 },
        { name: 'Add Steamed Basmati Rice', price: 3.00 },
        { name: 'Add Garlic Naan', price: 3.00 },
        { name: 'Rice + Garlic Naan', price: 5.00 },
      ]);
    }
    addGroup('Palak Paneer', 'Spice Route', 'Paneer', false, 1, 3, [
      { name: 'Regular Paneer (as made)', price: 0.00 },
      { name: 'Extra Paneer', price: 3.00 },
    ]);

    addGroup('Chicken Biryani', 'Spice Route', 'Protein', true, 1, 1, [
      { name: 'Chicken', price: 0.00 },
      { name: 'Lamb', price: 3.00 },
      { name: 'Vegetable', price: -2.00 },
    ]);
    addGroup('Chicken Biryani', 'Spice Route', 'Add-ons', false, null, 2, [
      { name: 'Add Raita', price: 2.00 },
      { name: 'Add Shorba (Broth)', price: 2.00 },
    ]);

    addGroup('Garlic Naan', 'Spice Route', 'Flavor', true, 1, 1, [
      { name: 'Garlic', price: 0.00 },
      { name: 'Plain', price: -1.00 },
      { name: 'Garlic Cheese', price: 2.00 },
      { name: 'Garlic Chili', price: 0.00 },
    ]);
    addGroup('Garlic Naan', 'Spice Route', 'Quantity', false, 1, 2, [
      { name: '1 piece (as made)', price: 0.00 },
      { name: '2 pieces', price: 3.00 },
      { name: '3 pieces', price: 6.00 },
    ]);

    addGroup('Lamb Keema Paratha', 'Spice Route', 'Add-ons', false, null, 1, [
      { name: 'Extra Raita', price: 1.00 },
      { name: 'Add Achaar (Pickle)', price: 1.00 },
    ]);

    addGroup('Gulab Jamun (4 pcs)', 'Spice Route', 'Quantity', false, 1, 1, [
      { name: '4 pieces (as made)', price: 0.00 },
      { name: '8 pieces', price: 5.00 },
    ]);
    addGroup('Gulab Jamun (4 pcs)', 'Spice Route', 'Add-ons', false, null, 2, [
      { name: 'Add Vanilla Ice Cream', price: 3.00 },
    ]);

    addGroup('Kulfi Falooda', 'Spice Route', 'Kulfi Flavor', true, 1, 1, [
      { name: 'Pistachio', price: 0.00 },
      { name: 'Mango', price: 0.00 },
      { name: 'Rose', price: 0.00 },
    ]);

    // ===== 5. GOLDEN DRAGON =====
    for (const dumpling of ['Har Gow (4 pcs)', 'Siu Mai (4 pcs)']) {
      addGroup(dumpling, 'Golden Dragon', 'Quantity', false, 1, 1, [
        { name: '4 pieces (as made)', price: 0.00 },
        { name: '8 pieces', price: 7.00 },
      ]);
    }
    addGroup('Siu Mai (4 pcs)', 'Golden Dragon', 'Add-ons', false, null, 2, [
      { name: 'Add Fish Roe Topping', price: 2.00 },
    ]);

    addGroup('BBQ Pork Bao (3 pcs)', 'Golden Dragon', 'Style', true, 1, 1, [
      { name: 'Steamed', price: 0.00 },
      { name: 'Baked', price: 0.00 },
    ]);
    addGroup('BBQ Pork Bao (3 pcs)', 'Golden Dragon', 'Quantity', false, 1, 2, [
      { name: '3 pieces (as made)', price: 0.00 },
      { name: '6 pieces', price: 8.00 },
    ]);

    addGroup('Hot & Sour Soup', 'Golden Dragon', 'Size', false, 1, 1, [
      { name: 'Regular (as made)', price: 0.00 },
      { name: 'Large', price: 3.00 },
    ]);
    addGroup('Hot & Sour Soup', 'Golden Dragon', 'Spice Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Hot & Sour Soup', 'Golden Dragon', 'Add-ons', false, null, 3, [
      { name: 'Add Wontons', price: 3.00 },
    ]);

    addGroup('Spring Rolls (4 pcs)', 'Golden Dragon', 'Filling', true, 1, 1, [
      { name: 'Pork & Cabbage', price: 0.00 },
      { name: 'Vegetable', price: 0.00 },
      { name: 'Shrimp', price: 2.00 },
    ]);
    addGroup('Spring Rolls (4 pcs)', 'Golden Dragon', 'Dipping Sauce', true, 1, 2, [
      { name: 'Sweet Chili', price: 0.00 },
      { name: 'Plum Sauce', price: 0.00 },
      { name: 'Both', price: 0.00 },
    ]);
    addGroup('Spring Rolls (4 pcs)', 'Golden Dragon', 'Quantity', false, 1, 3, [
      { name: '4 pieces (as made)', price: 0.00 },
      { name: '8 pieces', price: 8.00 },
    ]);

    addGroup('Wonton Soup', 'Golden Dragon', 'Size', false, 1, 1, [
      { name: 'Regular (as made)', price: 0.00 },
      { name: 'Large', price: 3.00 },
    ]);
    addGroup('Wonton Soup', 'Golden Dragon', 'Add-ons', false, null, 2, [
      { name: 'Extra Wontons', price: 4.00 },
      { name: 'Add Noodles', price: 2.00 },
    ]);

    addGroup('Kung Pao Chicken', 'Golden Dragon', 'Protein', true, 1, 1, [
      { name: 'Chicken', price: 0.00 },
      { name: 'Shrimp', price: 3.00 },
      { name: 'Tofu', price: -1.00 },
    ]);
    addGroup('Kung Pao Chicken', 'Golden Dragon', 'Spice Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Kung Pao Chicken', 'Golden Dragon', 'Add Rice', true, 1, 3, [
      { name: 'No rice', price: 0.00 },
      { name: 'Steamed Rice', price: 2.00 },
      { name: 'Fried Rice', price: 3.00 },
    ]);

    addGroup('Peking Duck (half)', 'Golden Dragon', 'Add-ons', false, null, 1, [
      { name: 'Extra Pancakes', price: 3.00 },
      { name: 'Extra Hoisin Sauce', price: 1.00 },
      { name: 'Add Steamed Buns', price: 4.00 },
    ]);

    addGroup('Mapo Tofu', 'Golden Dragon', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Numbing Hot', price: 0.00 },
    ]);
    addGroup('Mapo Tofu', 'Golden Dragon', 'Protein', true, 1, 2, [
      { name: 'Ground Pork', price: 0.00 },
      { name: 'Ground Beef', price: 1.00 },
      { name: 'Vegetarian (no meat)', price: -1.00 },
    ]);
    addGroup('Mapo Tofu', 'Golden Dragon', 'Add Rice', true, 1, 3, [
      { name: 'No rice', price: 0.00 },
      { name: 'Steamed Rice', price: 2.00 },
    ]);

    addGroup('Beef with Broccoli', 'Golden Dragon', 'Protein', true, 1, 1, [
      { name: 'Beef', price: 0.00 },
      { name: 'Chicken', price: -1.00 },
      { name: 'Shrimp', price: 2.00 },
    ]);
    addGroup('Beef with Broccoli', 'Golden Dragon', 'Add Rice', true, 1, 2, [
      { name: 'No rice', price: 0.00 },
      { name: 'Steamed Rice', price: 2.00 },
      { name: 'Fried Rice', price: 3.00 },
    ]);

    addGroup('Yang Chow Fried Rice', 'Golden Dragon', 'Size', false, 1, 1, [
      { name: 'Regular (as made)', price: 0.00 },
      { name: 'Large', price: 3.00 },
    ]);
    addGroup('Yang Chow Fried Rice', 'Golden Dragon', 'Protein', true, 1, 2, [
      { name: 'Mixed', price: 0.00 },
      { name: 'Extra Shrimp', price: 3.00 },
      { name: 'Vegetable', price: -1.00 },
    ]);

    addGroup('Dan Dan Noodles', 'Golden Dragon', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Dan Dan Noodles', 'Golden Dragon', 'Add-ons', false, null, 2, [
      { name: 'Extra Noodles', price: 2.00 },
      { name: 'Extra Ground Pork', price: 2.00 },
    ]);

    addGroup('Beef Chow Fun', 'Golden Dragon', 'Protein', true, 1, 1, [
      { name: 'Beef', price: 0.00 },
      { name: 'Chicken', price: -1.00 },
      { name: 'Shrimp', price: 2.00 },
    ]);
    addGroup('Beef Chow Fun', 'Golden Dragon', 'Style', true, 1, 2, [
      { name: 'Wet (soy sauce)', price: 0.00 },
      { name: 'Dry-tossed', price: 0.00 },
    ]);

    // ===== 6. LE PETIT BISTRO =====
    addGroup('Soupe à l\'Oignon', 'Le Petit Bistro', 'Size', false, 1, 1, [
      { name: 'Regular (as made)', price: 0.00 },
      { name: 'Large', price: 3.00 },
    ]);
    addGroup('Soupe à l\'Oignon', 'Le Petit Bistro', 'Add-ons', false, null, 2, [
      { name: 'Extra Gruyère', price: 2.00 },
      { name: 'Extra Croutons', price: 1.00 },
    ]);

    addGroup('Escargots de Bourgogne', 'Le Petit Bistro', 'Quantity', false, 1, 1, [
      { name: '6 pieces (as made)', price: 0.00 },
      { name: '12 pieces', price: 14.00 },
    ]);
    addGroup('Escargots de Bourgogne', 'Le Petit Bistro', 'Add-ons', false, null, 2, [
      { name: 'Extra Baguette', price: 2.00 },
      { name: 'Extra Garlic Herb Butter', price: 1.00 },
    ]);

    addGroup('Salade Niçoise', 'Le Petit Bistro', 'Protein', true, 1, 1, [
      { name: 'Tuna', price: 0.00 },
      { name: 'Seared Salmon', price: 4.00 },
      { name: 'Vegetarian (no fish)', price: -2.00 },
    ]);
    addGroup('Salade Niçoise', 'Le Petit Bistro', 'Dressing', true, 1, 2, [
      { name: 'Dijon Vinaigrette', price: 0.00 },
      { name: 'Lemon Herb', price: 0.00 },
    ]);

    addGroup('Steak Frites', 'Le Petit Bistro', 'Doneness', true, 1, 1, [
      { name: 'Rare', price: 0.00 },
      { name: 'Medium Rare', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Medium Well', price: 0.00 },
      { name: 'Well Done', price: 0.00 },
    ]);
    addGroup('Steak Frites', 'Le Petit Bistro', 'Sauce', true, 1, 2, [
      { name: 'Béarnaise', price: 0.00 },
      { name: 'Au Poivre', price: 0.00 },
      { name: 'Red Wine Jus', price: 0.00 },
      { name: 'Garlic Butter', price: 0.00 },
    ]);
    addGroup('Steak Frites', 'Le Petit Bistro', 'Side', true, 1, 3, [
      { name: 'Frites', price: 0.00 },
      { name: 'Salade Verte', price: 0.00 },
      { name: 'Haricots Verts', price: 2.00 },
    ]);

    addGroup('Bouillabaisse', 'Le Petit Bistro', 'Add-ons', false, null, 1, [
      { name: 'Extra Rouille Toast', price: 2.00 },
      { name: 'Extra Crusty Bread', price: 2.00 },
    ]);

    addGroup('Boeuf Bourguignon', 'Le Petit Bistro', 'Side', true, 1, 1, [
      { name: 'Mashed Potato', price: 0.00 },
      { name: 'Egg Noodles', price: 0.00 },
      { name: 'Crusty Bread', price: 0.00 },
    ]);
    addGroup('Boeuf Bourguignon', 'Le Petit Bistro', 'Add-ons', false, null, 2, [
      { name: 'Extra Braising Sauce', price: 2.00 },
    ]);

    addGroup('Sole Meunière', 'Le Petit Bistro', 'Side', true, 1, 1, [
      { name: 'Haricots Verts', price: 0.00 },
      { name: 'Pommes Vapeur', price: 0.00 },
      { name: 'Salade Verte', price: 0.00 },
    ]);
    addGroup('Sole Meunière', 'Le Petit Bistro', 'Add-ons', false, null, 2, [
      { name: 'Extra Lemon Caper Butter', price: 2.00 },
    ]);

    addGroup('Plateau de Fromages', 'Le Petit Bistro', 'Selection', false, 1, 1, [
      { name: 'Three cheeses (as made)', price: 0.00 },
      { name: 'Five cheeses', price: 8.00 },
    ]);
    addGroup('Plateau de Fromages', 'Le Petit Bistro', 'Add-ons', false, null, 2, [
      { name: 'Extra Honeycomb', price: 2.00 },
      { name: 'Extra Walnuts', price: 1.00 },
      { name: 'Extra Artisan Crackers', price: 1.00 },
    ]);

    addGroup('Crème Brûlée', 'Le Petit Bistro', 'Flavor', true, 1, 1, [
      { name: 'Classic Vanilla', price: 0.00 },
      { name: 'Lavender', price: 0.00 },
      { name: 'Earl Grey', price: 0.00 },
    ]);
    addGroup('Crème Brûlée', 'Le Petit Bistro', 'Add-ons', false, null, 2, [
      { name: 'Add Macaron', price: 3.00 },
      { name: 'Add Fresh Berries', price: 2.00 },
    ]);

    addGroup('Tarte Tatin', 'Le Petit Bistro', 'Accompaniment', true, 1, 1, [
      { name: 'Crème Fraîche', price: 0.00 },
      { name: 'Vanilla Ice Cream', price: 0.00 },
      { name: 'Both', price: 1.00 },
    ]);

    addGroup('Chocolate Fondant', 'Le Petit Bistro', 'Chocolate', true, 1, 1, [
      { name: '70% Dark', price: 0.00 },
      { name: 'Milk Chocolate', price: 0.00 },
    ]);
    addGroup('Chocolate Fondant', 'Le Petit Bistro', 'Accompaniment', true, 1, 2, [
      { name: 'Vanilla Bean Ice Cream', price: 0.00 },
      { name: 'Crème Anglaise', price: 0.00 },
      { name: 'Fresh Berries', price: 2.00 },
    ]);

    // ===== 7. OLIVE & SEA =====
    addGroup('Hummus & Pita', 'Olive & Sea', 'Style', true, 1, 1, [
      { name: 'Classic', price: 0.00 },
      { name: 'With Spiced Paprika & Extra Olive Oil', price: 0.00 },
      { name: 'With Toasted Pine Nuts', price: 1.00 },
    ]);
    addGroup('Hummus & Pita', 'Olive & Sea', 'Add-ons', false, null, 2, [
      { name: 'Extra Pita Bread', price: 1.00 },
      { name: 'Extra Hummus', price: 2.00 },
    ]);

    addGroup('Mezze Platter', 'Olive & Sea', 'Size', false, 1, 1, [
      { name: 'For Two (as made)', price: 0.00 },
      { name: 'For Four', price: 16.00 },
    ]);
    addGroup('Mezze Platter', 'Olive & Sea', 'Add-ons', false, null, 2, [
      { name: 'Add Dolmades (4 pcs)', price: 3.00 },
      { name: 'Add Extra Falafel', price: 4.00 },
      { name: 'Add Spanakopita (2 pcs)', price: 3.00 },
    ]);

    addGroup('Spanakopita (4 pcs)', 'Olive & Sea', 'Quantity', false, 1, 1, [
      { name: '4 pieces (as made)', price: 0.00 },
      { name: '8 pieces', price: 9.00 },
    ]);
    addGroup('Spanakopita (4 pcs)', 'Olive & Sea', 'Add-ons', false, null, 2, [
      { name: 'Add Tzatziki', price: 2.00 },
    ]);

    addGroup('Kibbeh (4 pcs)', 'Olive & Sea', 'Quantity', false, 1, 1, [
      { name: '4 pieces (as made)', price: 0.00 },
      { name: '8 pieces', price: 10.00 },
    ]);
    addGroup('Kibbeh (4 pcs)', 'Olive & Sea', 'Dipping Sauce', true, 1, 2, [
      { name: 'Yogurt Dip', price: 0.00 },
      { name: 'Tahini', price: 0.00 },
      { name: 'Both', price: 0.00 },
    ]);

    addGroup('Grilled Whole Branzino', 'Olive & Sea', 'Side', true, 1, 1, [
      { name: 'Roasted Vegetables', price: 0.00 },
      { name: 'Add Saffron Rice', price: 3.00 },
      { name: 'Add Greek Salad', price: 3.00 },
    ]);
    addGroup('Grilled Whole Branzino', 'Olive & Sea', 'Add-ons', false, null, 2, [
      { name: 'Add Lemon Butter Sauce', price: 2.00 },
    ]);

    addGroup('Shrimp Saganaki', 'Olive & Sea', 'Heat Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Shrimp Saganaki', 'Olive & Sea', 'Add-ons', false, null, 2, [
      { name: 'Extra Feta Cheese', price: 2.00 },
      { name: 'Add Pita Bread', price: 2.00 },
    ]);

    addGroup('Calamari Grillé', 'Olive & Sea', 'Sauce', true, 1, 1, [
      { name: 'Herb Chimichurri', price: 0.00 },
      { name: 'Tzatziki', price: 0.00 },
      { name: 'Harissa', price: 0.00 },
    ]);

    addGroup('Lamb Souvlaki', 'Olive & Sea', 'Protein', true, 1, 1, [
      { name: 'Lamb', price: 0.00 },
      { name: 'Chicken', price: -2.00 },
      { name: 'Mixed Lamb & Chicken', price: 0.00 },
    ]);
    addGroup('Lamb Souvlaki', 'Olive & Sea', 'Add-ons', false, null, 2, [
      { name: 'Extra Tzatziki', price: 1.00 },
      { name: 'Add Fries', price: 3.00 },
    ]);

    addGroup('Mixed Grill Platter', 'Olive & Sea', 'Side', true, 1, 1, [
      { name: 'Rice Pilaf', price: 0.00 },
      { name: 'Fries', price: 0.00 },
      { name: 'Rice Pilaf + Fries', price: 2.00 },
    ]);
    addGroup('Mixed Grill Platter', 'Olive & Sea', 'Add-ons', false, null, 2, [
      { name: 'Extra Grilled Protein', price: 7.00 },
      { name: 'Add Hummus', price: 2.00 },
    ]);

    addGroup('Falafel Bowl', 'Olive & Sea', 'Protein Boost', false, 1, 1, [
      { name: 'Falafel only (as made)', price: 0.00 },
      { name: 'Add Grilled Chicken', price: 4.00 },
      { name: 'Add Grilled Lamb', price: 5.00 },
    ]);
    addGroup('Falafel Bowl', 'Olive & Sea', 'Heat Level', true, 1, 2, [
      { name: 'Regular', price: 0.00 },
      { name: 'Add Harissa', price: 0.00 },
    ]);
    addGroup('Falafel Bowl', 'Olive & Sea', 'Add-ons', false, null, 3, [
      { name: 'Extra Hummus', price: 2.00 },
      { name: 'Extra Tahini', price: 1.00 },
    ]);

    addGroup('Baklava (4 pcs)', 'Olive & Sea', 'Quantity', false, 1, 1, [
      { name: '4 pieces (as made)', price: 0.00 },
      { name: '8 pieces', price: 8.00 },
    ]);
    addGroup('Baklava (4 pcs)', 'Olive & Sea', 'Nut Filling', true, 1, 2, [
      { name: 'Pistachio & Walnut', price: 0.00 },
      { name: 'All Pistachio', price: 0.00 },
      { name: 'All Walnut', price: 0.00 },
    ]);

    addGroup('Greek Yogurt with Honey', 'Olive & Sea', 'Toppings', false, null, 1, [
      { name: 'Add Granola', price: 1.00 },
      { name: 'Add Fresh Berries', price: 2.00 },
      { name: 'Add Baklava Crumble', price: 2.00 },
    ]);

    // ===== 8. SEOUL KITCHEN =====
    addGroup('Pajeon (Korean Scallion Pancake)', 'Seoul Kitchen', 'Filling', true, 1, 1, [
      { name: 'Mixed Seafood', price: 0.00 },
      { name: 'Kimchi', price: 0.00 },
      { name: 'Plain Scallion', price: -1.00 },
    ]);

    addGroup('Japchae', 'Seoul Kitchen', 'Protein', true, 1, 1, [
      { name: 'Beef', price: 0.00 },
      { name: 'Shrimp', price: 2.00 },
      { name: 'Tofu', price: -1.00 },
    ]);
    addGroup('Japchae', 'Seoul Kitchen', 'Add-ons', false, null, 2, [
      { name: 'Extra Glass Noodles', price: 2.00 },
    ]);

    addGroup('Tteokbokki', 'Seoul Kitchen', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Tteokbokki', 'Seoul Kitchen', 'Add-ons', false, null, 2, [
      { name: 'Add Ramen Noodles', price: 2.00 },
      { name: 'Add Mozzarella', price: 2.00 },
      { name: 'Extra Fish Cake', price: 1.00 },
    ]);

    addGroup('Bulgogi', 'Seoul Kitchen', 'Make it a Meal', true, 1, 1, [
      { name: 'Bulgogi only', price: 0.00 },
      { name: 'Add Steamed Rice + Banchan', price: 4.00 },
    ]);
    addGroup('Bulgogi', 'Seoul Kitchen', 'Add-ons', false, null, 2, [
      { name: 'Extra Beef', price: 5.00 },
      { name: 'Add Kimchi', price: 2.00 },
    ]);

    addGroup('Galbi (Short Ribs)', 'Seoul Kitchen', 'Make it a Meal', true, 1, 1, [
      { name: 'Galbi only', price: 0.00 },
      { name: 'Add Steamed Rice + Banchan', price: 5.00 },
    ]);
    addGroup('Galbi (Short Ribs)', 'Seoul Kitchen', 'Add-ons', false, null, 2, [
      { name: 'Add Kimchi', price: 2.00 },
      { name: 'Extra Soy Glaze', price: 0.00 },
    ]);

    addGroup('Samgyeopsal (Pork Belly)', 'Seoul Kitchen', 'Make it a Meal', true, 1, 1, [
      { name: 'Pork Belly only', price: 0.00 },
      { name: 'Add Steamed Rice + Doenjang Jjigae', price: 6.00 },
    ]);
    addGroup('Samgyeopsal (Pork Belly)', 'Seoul Kitchen', 'Add-ons', false, null, 2, [
      { name: 'Extra Ssam Vegetables', price: 1.00 },
      { name: 'Extra Gochujang', price: 0.00 },
      { name: 'Add Kimchi', price: 2.00 },
    ]);

    addGroup('Bibimbap', 'Seoul Kitchen', 'Protein', true, 1, 1, [
      { name: 'Bulgogi Beef', price: 0.00 },
      { name: 'Grilled Chicken', price: 0.00 },
      { name: 'Tofu', price: -1.00 },
      { name: 'No Protein', price: -2.00 },
    ]);
    addGroup('Bibimbap', 'Seoul Kitchen', 'Gochujang Spice', true, 1, 2, [
      { name: 'No Gochujang', price: 0.00 },
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Bibimbap', 'Seoul Kitchen', 'Egg', true, 1, 3, [
      { name: 'Fried Egg', price: 0.00 },
      { name: 'No Egg', price: 0.00 },
    ]);

    addGroup('Budae Jjigae (Army Stew)', 'Seoul Kitchen', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Budae Jjigae (Army Stew)', 'Seoul Kitchen', 'Add-ons', false, null, 2, [
      { name: 'Extra Ramen Noodles', price: 2.00 },
      { name: 'Add Rice Cake (Tteok)', price: 2.00 },
      { name: 'Extra Spam', price: 2.00 },
    ]);

    addGroup('Doenjang Jjigae', 'Seoul Kitchen', 'Protein Add-on', false, 1, 1, [
      { name: 'Tofu only (as made)', price: 0.00 },
      { name: 'Add Beef', price: 3.00 },
      { name: 'Add Clams', price: 4.00 },
    ]);

    addGroup('Bingsu (Shaved Ice)', 'Seoul Kitchen', 'Flavor', true, 1, 1, [
      { name: 'Strawberry', price: 0.00 },
      { name: 'Matcha', price: 0.00 },
      { name: 'Mango', price: 0.00 },
      { name: 'Injeolmi (Roasted Soybean)', price: 0.00 },
    ]);
    addGroup('Bingsu (Shaved Ice)', 'Seoul Kitchen', 'Add-ons', false, null, 2, [
      { name: 'Extra Sweet Red Beans', price: 1.00 },
      { name: 'Extra Mochi', price: 1.00 },
      { name: 'Add Ice Cream Scoop', price: 2.00 },
    ]);

    addGroup('Hotteok (Sweet Pancake)', 'Seoul Kitchen', 'Filling', true, 1, 1, [
      { name: 'Brown Sugar & Cinnamon', price: 0.00 },
      { name: 'Nutella & Banana', price: 0.00 },
      { name: 'Red Bean', price: 0.00 },
    ]);
    addGroup('Hotteok (Sweet Pancake)', 'Seoul Kitchen', 'Quantity', false, 1, 2, [
      { name: '2 pieces (as made)', price: 0.00 },
      { name: '4 pieces', price: 6.00 },
    ]);

    // ===== 9. THAI ORCHID =====
    addGroup('Satay Chicken (6 skewers)', 'Thai Orchid', 'Protein', true, 1, 1, [
      { name: 'Chicken', price: 0.00 },
      { name: 'Pork', price: 1.00 },
      { name: 'Beef', price: 2.00 },
    ]);
    addGroup('Satay Chicken (6 skewers)', 'Thai Orchid', 'Quantity', false, 1, 2, [
      { name: '6 skewers (as made)', price: 0.00 },
      { name: '12 skewers', price: 10.00 },
    ]);
    addGroup('Satay Chicken (6 skewers)', 'Thai Orchid', 'Peanut Sauce', true, 1, 3, [
      { name: 'Regular Peanut Sauce', price: 0.00 },
      { name: 'Spicy Peanut Sauce', price: 0.00 },
    ]);

    addGroup('Spring Rolls Tod (4 pcs)', 'Thai Orchid', 'Filling', true, 1, 1, [
      { name: 'Vegetable', price: 0.00 },
      { name: 'Shrimp', price: 2.00 },
      { name: 'Mixed Veggie & Shrimp', price: 1.00 },
    ]);
    addGroup('Spring Rolls Tod (4 pcs)', 'Thai Orchid', 'Quantity', false, 1, 2, [
      { name: '4 pieces (as made)', price: 0.00 },
      { name: '8 pieces', price: 8.00 },
    ]);

    addGroup('Tom Yum Goong', 'Thai Orchid', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Tom Yum Goong', 'Thai Orchid', 'Size', false, 1, 2, [
      { name: 'Regular (as made)', price: 0.00 },
      { name: 'Large', price: 4.00 },
    ]);
    addGroup('Tom Yum Goong', 'Thai Orchid', 'Add-ons', false, null, 3, [
      { name: 'Extra Tiger Prawns', price: 5.00 },
    ]);

    addGroup('Tom Kha Gai', 'Thai Orchid', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Tom Kha Gai', 'Thai Orchid', 'Protein', true, 1, 2, [
      { name: 'Chicken', price: 0.00 },
      { name: 'Shrimp', price: 3.00 },
      { name: 'Tofu', price: -1.00 },
    ]);
    addGroup('Tom Kha Gai', 'Thai Orchid', 'Add-ons', false, null, 3, [
      { name: 'Extra Coconut Milk', price: 1.00 },
    ]);

    addGroup('Som Tum (Papaya Salad)', 'Thai Orchid', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot (Thai hot)', price: 0.00 },
    ]);
    addGroup('Som Tum (Papaya Salad)', 'Thai Orchid', 'Add-ons', false, null, 2, [
      { name: 'Add Dried Shrimp', price: 1.00 },
      { name: 'Extra Peanuts', price: 1.00 },
    ]);

    addGroup('Green Curry with Chicken', 'Thai Orchid', 'Protein', true, 1, 1, [
      { name: 'Chicken', price: 0.00 },
      { name: 'Shrimp', price: 3.00 },
      { name: 'Tofu', price: -1.00 },
    ]);
    addGroup('Green Curry with Chicken', 'Thai Orchid', 'Spice Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Green Curry with Chicken', 'Thai Orchid', 'Add-ons', false, null, 3, [
      { name: 'Extra Jasmine Rice', price: 2.00 },
    ]);

    addGroup('Massaman Beef Curry', 'Thai Orchid', 'Protein', true, 1, 1, [
      { name: 'Beef', price: 0.00 },
      { name: 'Chicken', price: -1.00 },
      { name: 'Tofu', price: -2.00 },
    ]);
    addGroup('Massaman Beef Curry', 'Thai Orchid', 'Spice Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Massaman Beef Curry', 'Thai Orchid', 'Add-ons', false, null, 3, [
      { name: 'Extra Jasmine Rice', price: 2.00 },
    ]);

    addGroup('Pad Thai with Shrimp', 'Thai Orchid', 'Protein', true, 1, 1, [
      { name: 'Shrimp', price: 0.00 },
      { name: 'Chicken', price: -1.00 },
      { name: 'Tofu', price: -1.00 },
      { name: 'Mixed Shrimp & Chicken', price: 2.00 },
    ]);
    addGroup('Pad Thai with Shrimp', 'Thai Orchid', 'Spice Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Pad Thai with Shrimp', 'Thai Orchid', 'Add-ons', false, null, 3, [
      { name: 'Extra Peanuts', price: 0.00 },
      { name: 'Extra Bean Sprouts', price: 0.00 },
      { name: 'Extra Lime', price: 0.00 },
    ]);

    addGroup('Basil Stir-Fry (Pad Kra Pao)', 'Thai Orchid', 'Protein', true, 1, 1, [
      { name: 'Pork', price: 0.00 },
      { name: 'Chicken', price: 0.00 },
      { name: 'Beef', price: 2.00 },
      { name: 'Tofu', price: -1.00 },
    ]);
    addGroup('Basil Stir-Fry (Pad Kra Pao)', 'Thai Orchid', 'Spice Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Basil Stir-Fry (Pad Kra Pao)', 'Thai Orchid', 'Egg', true, 1, 3, [
      { name: 'Crispy Fried Egg', price: 0.00 },
      { name: 'No Egg', price: 0.00 },
      { name: 'Extra Egg', price: 1.00 },
    ]);
    addGroup('Basil Stir-Fry (Pad Kra Pao)', 'Thai Orchid', 'Add-ons', false, null, 4, [
      { name: 'Add Jasmine Rice', price: 2.00 },
    ]);

    addGroup('Mango Sticky Rice', 'Thai Orchid', 'Add-ons', false, null, 1, [
      { name: 'Extra Fresh Mango', price: 3.00 },
      { name: 'Extra Coconut Cream', price: 1.00 },
    ]);

    addGroup('Thai Tea Panna Cotta', 'Thai Orchid', 'Add-ons', false, null, 1, [
      { name: 'Add Fresh Fruit', price: 2.00 },
      { name: 'Extra Condensed Milk', price: 0.00 },
    ]);

    // ===== 10. THE AMERICAN GRILL =====
    addGroup('Buffalo Wings (10 pcs)', 'The American Grill', 'Sauce', true, 1, 1, [
      { name: 'Classic Buffalo', price: 0.00 },
      { name: 'BBQ', price: 0.00 },
      { name: 'Honey Garlic', price: 0.00 },
      { name: 'Lemon Pepper', price: 0.00 },
      { name: 'Dry Rub Only', price: 0.00 },
    ]);
    addGroup('Buffalo Wings (10 pcs)', 'The American Grill', 'Heat Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Buffalo Wings (10 pcs)', 'The American Grill', 'Quantity', false, 1, 3, [
      { name: '10 pieces (as made)', price: 0.00 },
      { name: '20 pieces', price: 13.00 },
      { name: '30 pieces', price: 25.00 },
    ]);
    addGroup('Buffalo Wings (10 pcs)', 'The American Grill', 'Dipping Sauce', true, 1, 4, [
      { name: 'Blue Cheese', price: 0.00 },
      { name: 'Ranch', price: 0.00 },
      { name: 'Both', price: 0.00 },
    ]);

    addGroup('Loaded Potato Skins (6 pcs)', 'The American Grill', 'Add-ons', false, null, 1, [
      { name: 'Extra Cheddar Cheese', price: 1.00 },
      { name: 'Extra Bacon Bits', price: 2.00 },
      { name: 'Extra Sour Cream', price: 1.00 },
    ]);

    addGroup('Onion Rings', 'The American Grill', 'Size', false, 1, 1, [
      { name: 'Regular (as made)', price: 0.00 },
      { name: 'Large', price: 3.00 },
    ]);
    addGroup('Onion Rings', 'The American Grill', 'Dipping Sauce', true, 1, 2, [
      { name: 'Chipotle Ranch', price: 0.00 },
      { name: 'BBQ Sauce', price: 0.00 },
      { name: 'Ranch', price: 0.00 },
    ]);

    addGroup('Mac & Cheese Bites (8 pcs)', 'The American Grill', 'Quantity', false, 1, 1, [
      { name: '8 pieces (as made)', price: 0.00 },
      { name: '16 pieces', price: 10.00 },
    ]);
    addGroup('Mac & Cheese Bites (8 pcs)', 'The American Grill', 'Dipping Sauce', true, 1, 2, [
      { name: 'Chipotle Ranch', price: 0.00 },
      { name: 'BBQ Sauce', price: 0.00 },
      { name: 'Marinara', price: 0.00 },
    ]);

    for (const sandwich of ['Classic Smash Burger', 'BBQ Bacon Burger', 'Crispy Chicken Sandwich', 'Philly Cheesesteak']) {
      addGroup(sandwich, 'The American Grill', 'Make it a Meal', true, 1, 1, [
        { name: 'Sandwich only', price: 0.00 },
        { name: 'Add Fries', price: 3.00 },
        { name: 'Add Fries + Fountain Drink', price: 6.00 },
      ]);
    }

    addGroup('Classic Smash Burger', 'The American Grill', 'Cheese', true, 1, 2, [
      { name: 'American', price: 0.00 },
      { name: 'Cheddar', price: 0.00 },
      { name: 'Swiss', price: 0.00 },
      { name: 'No Cheese', price: 0.00 },
    ]);
    addGroup('Classic Smash Burger', 'The American Grill', 'Bun', true, 1, 3, [
      { name: 'Brioche', price: 0.00 },
      { name: 'Gluten-Free Bun', price: 2.00 },
      { name: 'Lettuce Wrap', price: 0.00 },
    ]);
    addGroup('Classic Smash Burger', 'The American Grill', 'Add-ons', false, null, 4, [
      { name: 'Extra Patty', price: 4.00 },
      { name: 'Add Bacon', price: 2.00 },
      { name: 'Add Avocado', price: 1.50 },
      { name: 'Add Fried Egg', price: 1.00 },
    ]);

    addGroup('BBQ Bacon Burger', 'The American Grill', 'Doneness', true, 1, 2, [
      { name: 'Medium', price: 0.00 },
      { name: 'Medium Rare', price: 0.00 },
      { name: 'Medium Well', price: 0.00 },
      { name: 'Well Done', price: 0.00 },
    ]);
    addGroup('BBQ Bacon Burger', 'The American Grill', 'Add-ons', false, null, 3, [
      { name: 'Extra Bacon', price: 2.00 },
      { name: 'Extra Cheddar', price: 1.00 },
      { name: 'Add Jalapeños', price: 0.00 },
      { name: 'Add Avocado', price: 1.50 },
    ]);

    addGroup('Crispy Chicken Sandwich', 'The American Grill', 'Heat Level', true, 1, 2, [
      { name: 'No Heat', price: 0.00 },
      { name: 'Regular Hot Honey', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Crispy Chicken Sandwich', 'The American Grill', 'Add-ons', false, null, 3, [
      { name: 'Add Bacon', price: 2.00 },
      { name: 'Add Avocado', price: 1.50 },
      { name: 'Extra Coleslaw', price: 0.00 },
    ]);

    addGroup('Philly Cheesesteak', 'The American Grill', 'Cheese', true, 1, 2, [
      { name: 'Provolone', price: 0.00 },
      { name: 'American', price: 0.00 },
      { name: 'Cheez Whiz', price: 0.00 },
    ]);
    addGroup('Philly Cheesesteak', 'The American Grill', 'Add-ons', false, null, 3, [
      { name: 'Extra Ribeye Meat', price: 4.00 },
      { name: 'Extra Peppers & Onions', price: 0.00 },
      { name: 'Add Mushrooms', price: 0.00 },
    ]);

    addGroup('BBQ Baby Back Ribs (Half Rack)', 'The American Grill', 'BBQ Sauce', true, 1, 1, [
      { name: 'Tangy BBQ', price: 0.00 },
      { name: 'Sweet BBQ', price: 0.00 },
      { name: 'Spicy BBQ', price: 0.00 },
      { name: 'Dry Rub Only', price: 0.00 },
    ]);
    addGroup('BBQ Baby Back Ribs (Half Rack)', 'The American Grill', 'Upgrade', false, 1, 2, [
      { name: 'Half Rack (as made)', price: 0.00 },
      { name: 'Full Rack', price: 22.00 },
    ]);
    addGroup('BBQ Baby Back Ribs (Half Rack)', 'The American Grill', 'Add-ons', false, null, 3, [
      { name: 'Add Mac & Cheese', price: 3.00 },
      { name: 'Extra Cornbread', price: 2.00 },
    ]);

    addGroup('NY Strip Steak (12oz)', 'The American Grill', 'Doneness', true, 1, 1, [
      { name: 'Rare', price: 0.00 },
      { name: 'Medium Rare', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Medium Well', price: 0.00 },
      { name: 'Well Done', price: 0.00 },
    ]);
    addGroup('NY Strip Steak (12oz)', 'The American Grill', 'Sauce', true, 1, 2, [
      { name: 'Au Jus', price: 0.00 },
      { name: 'Peppercorn', price: 0.00 },
      { name: 'Chimichurri', price: 0.00 },
      { name: 'Garlic Butter', price: 0.00 },
    ]);
    addGroup('NY Strip Steak (12oz)', 'The American Grill', 'Side', true, 1, 3, [
      { name: 'Mashed Potatoes + Seasonal Veg', price: 0.00 },
      { name: 'Fries', price: 0.00 },
      { name: 'Mac & Cheese', price: 3.00 },
      { name: 'Loaded Mashed Potatoes', price: 2.00 },
    ]);

    addGroup('Chicken & Waffles', 'The American Grill', 'Sauce', true, 1, 1, [
      { name: 'Maple Syrup + Hot Sauce', price: 0.00 },
      { name: 'Extra Maple Syrup', price: 0.00 },
      { name: 'Honey Butter', price: 0.00 },
    ]);
    addGroup('Chicken & Waffles', 'The American Grill', 'Add-ons', false, null, 2, [
      { name: 'Add Bacon', price: 2.00 },
      { name: 'Extra Chicken Thigh', price: 5.00 },
      { name: 'Add Fried Egg', price: 1.00 },
    ]);

    addGroup('New York Cheesecake', 'The American Grill', 'Topping', true, 1, 1, [
      { name: 'Fresh Berry Compote', price: 0.00 },
      { name: 'Caramel Sauce', price: 0.00 },
      { name: 'Hot Fudge', price: 0.00 },
      { name: 'Plain', price: 0.00 },
    ]);
    addGroup('New York Cheesecake', 'The American Grill', 'Add-ons', false, null, 2, [
      { name: 'Add Whipped Cream', price: 1.00 },
    ]);

    addGroup('Warm Chocolate Brownie', 'The American Grill', 'Add-ons', false, null, 1, [
      { name: 'Extra Hot Fudge', price: 1.00 },
      { name: 'Extra Ice Cream Scoop', price: 2.00 },
      { name: 'Add Whipped Cream', price: 1.00 },
    ]);

    addGroup('Apple Pie à la Mode', 'The American Grill', 'Topping', true, 1, 1, [
      { name: 'Vanilla Ice Cream', price: 0.00 },
      { name: 'Add Caramel Drizzle', price: 0.50 },
      { name: 'Whipped Cream', price: 0.00 },
    ]);
    addGroup('Apple Pie à la Mode', 'The American Grill', 'Temperature', true, 1, 2, [
      { name: 'Warm', price: 0.00 },
      { name: 'Cold', price: 0.00 },
    ]);

    // ===== 11. TRATTORIA ROMA =====
    addGroup('Supplì al Telefono', 'Trattoria Roma', 'Add-ons', false, null, 1, [
      { name: 'Extra Supplì (2 pcs)', price: 4.00 },
      { name: 'Extra Tomato Sauce', price: 0.50 },
    ]);

    addGroup('Fiori di Zucca Fritti', 'Trattoria Roma', 'Add-ons', false, null, 1, [
      { name: 'Extra Anchovy', price: 1.00 },
      { name: 'Add Lemon Aioli', price: 1.00 },
    ]);

    addGroup('Bruschetta con Fegatini', 'Trattoria Roma', 'Add-ons', false, null, 1, [
      { name: 'Extra Bread', price: 1.50 },
      { name: 'Extra Pâté', price: 2.00 },
    ]);

    addGroup('Risotto alla Milanese', 'Trattoria Roma', 'Add-ons', false, null, 1, [
      { name: 'Extra Bone Marrow', price: 4.00 },
      { name: 'Extra Parmigiano-Reggiano', price: 1.00 },
    ]);

    addGroup('Risotto ai Funghi Porcini', 'Trattoria Roma', 'Add-ons', false, null, 1, [
      { name: 'Extra Porcini', price: 3.00 },
      { name: 'Add Truffle Shaving', price: 6.00 },
    ]);

    addGroup('Cacio e Pepe', 'Trattoria Roma', 'Pasta Shape', true, 1, 1, [
      { name: 'Tonnarelli', price: 0.00 },
      { name: 'Spaghetti', price: 0.00 },
      { name: 'Rigatoni', price: 0.00 },
    ]);
    addGroup('Cacio e Pepe', 'Trattoria Roma', 'Add-ons', false, null, 2, [
      { name: 'Extra Pecorino Romano', price: 1.00 },
      { name: 'Extra Black Pepper', price: 0.00 },
    ]);

    addGroup('Bucatini all\'Amatriciana', 'Trattoria Roma', 'Heat Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Bucatini all\'Amatriciana', 'Trattoria Roma', 'Add-ons', false, null, 2, [
      { name: 'Extra Guanciale', price: 2.00 },
      { name: 'Extra Pecorino Romano', price: 1.00 },
    ]);

    addGroup('Gnocchi alla Romana', 'Trattoria Roma', 'Add-ons', false, null, 1, [
      { name: 'Extra Parmigiano Crust', price: 1.00 },
      { name: 'Add Truffle Butter', price: 4.00 },
    ]);

    addGroup('Crostata di Ricotta', 'Trattoria Roma', 'Add-ons', false, null, 1, [
      { name: 'Add Whipped Cream', price: 1.00 },
      { name: 'Add Espresso', price: 2.50 },
    ]);

    addGroup('Semifreddo al Torroncino', 'Trattoria Roma', 'Add-ons', false, null, 1, [
      { name: 'Extra Caramel Drizzle', price: 1.00 },
      { name: 'Add Fresh Berries', price: 2.00 },
    ]);

    // ===== 12. RAMEN KAZU =====
    addGroup('Gyoza (6 pcs)', 'Ramen Kazu', 'Cooking Style', true, 1, 1, [
      { name: 'Pan-fried', price: 0.00 },
      { name: 'Steamed', price: 0.00 },
    ]);
    addGroup('Gyoza (6 pcs)', 'Ramen Kazu', 'Quantity', false, 1, 2, [
      { name: '6 pieces', price: 0.00 },
      { name: '12 pieces', price: 8.00 },
    ]);
    addGroup('Gyoza (6 pcs)', 'Ramen Kazu', 'Add-ons', false, null, 3, [
      { name: 'Add Chili Oil', price: 0.00 },
      { name: 'Extra Yuzu Ponzu', price: 0.50 },
    ]);

    addGroup('Karaage Chicken', 'Ramen Kazu', 'Sauce', true, 1, 1, [
      { name: 'Kewpie Mayo', price: 0.00 },
      { name: 'Spicy Mayo', price: 0.00 },
      { name: 'Ponzu', price: 0.00 },
    ]);
    addGroup('Karaage Chicken', 'Ramen Kazu', 'Make it a Meal', true, 1, 2, [
      { name: 'Karaage only', price: 0.00 },
      { name: 'Add Steamed Rice + Miso Soup', price: 5.00 },
    ]);

    addGroup('Takoyaki (6 pcs)', 'Ramen Kazu', 'Sauce', true, 1, 1, [
      { name: 'Classic (mayo + bonito + okonomiyaki sauce)', price: 0.00 },
      { name: 'Spicy Mayo', price: 0.00 },
    ]);
    addGroup('Takoyaki (6 pcs)', 'Ramen Kazu', 'Quantity', false, 1, 2, [
      { name: '6 pieces', price: 0.00 },
      { name: '12 pieces', price: 9.00 },
    ]);

    addGroup('Tonkotsu Ramen', 'Ramen Kazu', 'Broth Richness', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Rich (kotteri)', price: 0.00 },
      { name: 'Light (assari)', price: 0.00 },
    ]);
    addGroup('Tonkotsu Ramen', 'Ramen Kazu', 'Noodle Firmness', true, 1, 2, [
      { name: 'Regular', price: 0.00 },
      { name: 'Firm (kata)', price: 0.00 },
      { name: 'Extra Firm (harigane)', price: 0.00 },
    ]);
    addGroup('Tonkotsu Ramen', 'Ramen Kazu', 'Spice', true, 1, 3, [
      { name: 'No spice', price: 0.00 },
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Spicy', price: 0.00 },
    ]);
    addGroup('Tonkotsu Ramen', 'Ramen Kazu', 'Extra Toppings', false, null, 4, [
      { name: 'Extra Chashu Pork', price: 4.00 },
      { name: 'Extra Soft-Boiled Egg', price: 2.00 },
      { name: 'Extra Nori', price: 1.00 },
      { name: 'Extra Bamboo Shoots', price: 1.00 },
    ]);

    addGroup('Spicy Miso Ramen', 'Ramen Kazu', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Spicy Miso Ramen', 'Ramen Kazu', 'Noodle Firmness', true, 1, 2, [
      { name: 'Regular', price: 0.00 },
      { name: 'Firm', price: 0.00 },
      { name: 'Extra Firm', price: 0.00 },
    ]);
    addGroup('Spicy Miso Ramen', 'Ramen Kazu', 'Extra Toppings', false, null, 3, [
      { name: 'Extra Ground Pork', price: 3.00 },
      { name: 'Extra Soft-Boiled Egg', price: 2.00 },
      { name: 'Extra Corn', price: 0.00 },
    ]);

    addGroup('Shoyu Ramen', 'Ramen Kazu', 'Noodle Firmness', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Firm', price: 0.00 },
      { name: 'Extra Firm', price: 0.00 },
    ]);
    addGroup('Shoyu Ramen', 'Ramen Kazu', 'Extra Toppings', false, null, 2, [
      { name: 'Extra Chicken Chashu', price: 4.00 },
      { name: 'Add Soft-Boiled Egg', price: 2.00 },
      { name: 'Extra Nori', price: 1.00 },
    ]);

    addGroup('Vegan Shio Ramen', 'Ramen Kazu', 'Extra Toppings', false, null, 1, [
      { name: 'Extra Tofu', price: 2.00 },
      { name: 'Add Nori', price: 1.00 },
      { name: 'Extra Roasted Vegetables', price: 2.00 },
    ]);

    addGroup('Chashu Don', 'Ramen Kazu', 'Make it a Set', true, 1, 1, [
      { name: 'Bowl only', price: 0.00 },
      { name: 'Add Miso Soup', price: 2.00 },
    ]);
    addGroup('Chashu Don', 'Ramen Kazu', 'Add-ons', false, null, 2, [
      { name: 'Extra Chashu Pork', price: 4.00 },
      { name: 'Add Soft-Boiled Egg', price: 2.00 },
    ]);

    addGroup('Salmon Ikura Don', 'Ramen Kazu', 'Add-ons', false, null, 1, [
      { name: 'Extra Salmon Roe', price: 3.00 },
      { name: 'Add Miso Soup', price: 2.00 },
    ]);

    // ===== 13. EL TAQUERO =====
    addGroup('Queso Fundido', 'El Taquero', 'Chorizo', true, 1, 1, [
      { name: 'With Chorizo', price: 0.00 },
      { name: 'Extra Chorizo', price: 2.00 },
      { name: 'Without Chorizo', price: 0.00 },
    ]);
    addGroup('Queso Fundido', 'El Taquero', 'Add-ons', false, null, 2, [
      { name: 'Extra Flour Tortillas', price: 2.00 },
      { name: 'Add Jalapeños', price: 0.00 },
    ]);

    addGroup('Tostadas de Tinga', 'El Taquero', 'Heat Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Tostadas de Tinga', 'El Taquero', 'Add-ons', false, null, 2, [
      { name: 'Extra Avocado', price: 1.50 },
      { name: 'Extra Queso Fresco', price: 1.00 },
    ]);

    addGroup('Sopa de Lima', 'El Taquero', 'Add-ons', false, null, 1, [
      { name: 'Extra Tortilla Strips', price: 0.50 },
      { name: 'Add Extra Lime', price: 0.00 },
    ]);

    for (const taco of ['Taco de Birria', 'Taco de Lengua', 'Taco de Barbacoa', 'Taco de Nopal']) {
      addGroup(taco, 'El Taquero', 'Quantity', true, 1, 1, [
        { name: '1 taco', price: 0.00 },
        { name: '3 tacos', price: (taco === 'Taco de Birria' ? 11.00 : taco === 'Taco de Lengua' ? 9.50 : taco === 'Taco de Barbacoa' ? 10.50 : 8.50) },
      ]);
    }
    addGroup('Taco de Birria', 'El Taquero', 'Add-ons', false, null, 2, [
      { name: 'Extra Consommé', price: 1.00 },
      { name: 'Add Guacamole', price: 1.50 },
    ]);
    addGroup('Taco de Lengua', 'El Taquero', 'Salsa', true, 1, 2, [
      { name: 'Salsa Verde', price: 0.00 },
      { name: 'Salsa Roja', price: 0.00 },
      { name: 'Both', price: 0.00 },
    ]);
    addGroup('Taco de Lengua', 'El Taquero', 'Add-ons', false, null, 3, [
      { name: 'Add Guacamole', price: 1.50 },
    ]);
    addGroup('Taco de Barbacoa', 'El Taquero', 'Add-ons', false, null, 2, [
      { name: 'Extra Avocado Salsa', price: 1.00 },
      { name: 'Add Pickled Red Onion', price: 0.00 },
    ]);
    addGroup('Taco de Nopal', 'El Taquero', 'Add-ons', false, null, 2, [
      { name: 'Extra Black Beans', price: 1.00 },
      { name: 'Add Guacamole', price: 1.50 },
    ]);

    addGroup('Enchiladas Verdes', 'El Taquero', 'Protein', true, 1, 1, [
      { name: 'Chicken', price: 0.00 },
      { name: 'Beef', price: 2.00 },
      { name: 'Bean & Cheese (vegetarian)', price: -1.00 },
    ]);
    addGroup('Enchiladas Verdes', 'El Taquero', 'Heat Level', true, 1, 2, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Enchiladas Verdes', 'El Taquero', 'Add-ons', false, null, 3, [
      { name: 'Extra Salsa Verde', price: 1.00 },
      { name: 'Extra Crema', price: 0.50 },
    ]);

    addGroup('Mole Negro con Pollo', 'El Taquero', 'Add-ons', false, null, 1, [
      { name: 'Extra Tortillas', price: 1.00 },
      { name: 'Extra Sesame Seeds', price: 0.00 },
    ]);

    addGroup('Flan de Cajeta', 'El Taquero', 'Add-ons', false, null, 1, [
      { name: 'Extra Cajeta Caramel', price: 1.00 },
      { name: 'Add Whipped Cream', price: 1.00 },
    ]);

    // ===== 14. MASALA HOUSE =====
    addGroup('Aloo Tikki Chaat', 'Masala House', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Aloo Tikki Chaat', 'Masala House', 'Add-ons', false, null, 2, [
      { name: 'Extra Tamarind Chutney', price: 1.00 },
      { name: 'Extra Yogurt', price: 0.50 },
    ]);

    addGroup('Seekh Kebab', 'Masala House', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Seekh Kebab', 'Masala House', 'Make it a Meal', true, 1, 2, [
      { name: 'Kebabs only', price: 0.00 },
      { name: 'Add Naan + Raita', price: 5.00 },
    ]);
    addGroup('Seekh Kebab', 'Masala House', 'Add-ons', false, null, 3, [
      { name: 'Extra Mint Chutney', price: 1.00 },
    ]);

    addGroup('Dahi Puri', 'Masala House', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);

    addGroup('Tandoori Jhinga', 'Masala House', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Tandoori Jhinga', 'Masala House', 'Make it a Meal', true, 1, 2, [
      { name: 'Prawns only', price: 0.00 },
      { name: 'Add Naan + Raita', price: 5.00 },
    ]);
    addGroup('Tandoori Jhinga', 'Masala House', 'Add-ons', false, null, 3, [
      { name: 'Extra Mint Chutney', price: 1.00 },
    ]);

    addGroup('Murgh Malai Tikka', 'Masala House', 'Make it a Meal', true, 1, 1, [
      { name: 'Tikka only', price: 0.00 },
      { name: 'Add Naan + Raita', price: 5.00 },
    ]);
    addGroup('Murgh Malai Tikka', 'Masala House', 'Add-ons', false, null, 2, [
      { name: 'Extra Tikka', price: 6.00 },
    ]);

    addGroup('Kerala Fish Curry', 'Masala House', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Kerala Fish Curry', 'Masala House', 'Accompaniment', true, 1, 2, [
      { name: 'Curry only', price: 0.00 },
      { name: 'Add Steamed Basmati Rice', price: 3.00 },
      { name: 'Add Appam (rice pancake)', price: 3.00 },
      { name: 'Rice + Appam', price: 5.00 },
    ]);

    addGroup('Dal Makhani', 'Masala House', 'Accompaniment', true, 1, 1, [
      { name: 'Dal only', price: 0.00 },
      { name: 'Add Steamed Basmati Rice', price: 3.00 },
      { name: 'Add Garlic Naan', price: 3.00 },
      { name: 'Rice + Garlic Naan', price: 5.00 },
    ]);
    addGroup('Dal Makhani', 'Masala House', 'Add-ons', false, null, 2, [
      { name: 'Extra Cream', price: 0.50 },
      { name: 'Add Papadum', price: 1.00 },
    ]);

    addGroup('Lamb Nihari', 'Masala House', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Lamb Nihari', 'Masala House', 'Accompaniment', true, 1, 2, [
      { name: 'Nihari only', price: 0.00 },
      { name: 'Add Naan', price: 3.00 },
      { name: 'Add Steamed Basmati Rice', price: 3.00 },
    ]);
    addGroup('Lamb Nihari', 'Masala House', 'Add-ons', false, null, 3, [
      { name: 'Extra Ginger Julienne', price: 0.00 },
      { name: 'Extra Fried Onions', price: 0.50 },
    ]);

    addGroup('Lamb Biryani', 'Masala House', 'Accompaniment', true, 1, 1, [
      { name: 'Biryani only', price: 0.00 },
      { name: 'Add Raita', price: 2.00 },
      { name: 'Add Shorba (Broth)', price: 2.00 },
      { name: 'Raita + Shorba', price: 3.00 },
    ]);

    addGroup('Garlic Kulcha', 'Masala House', 'Flavor', true, 1, 1, [
      { name: 'Garlic Herb', price: 0.00 },
      { name: 'Plain', price: -1.00 },
      { name: 'Garlic Cheese', price: 2.00 },
    ]);
    addGroup('Garlic Kulcha', 'Masala House', 'Quantity', false, 1, 2, [
      { name: '1 piece', price: 0.00 },
      { name: '2 pieces', price: 4.00 },
    ]);

    // ===== 15. DRAGON PALACE =====
    addGroup('Char Siu Bao (3 pcs)', 'Dragon Palace', 'Style', true, 1, 1, [
      { name: 'Steamed', price: 0.00 },
      { name: 'Baked', price: 0.00 },
    ]);
    addGroup('Char Siu Bao (3 pcs)', 'Dragon Palace', 'Quantity', false, 1, 2, [
      { name: '3 pieces', price: 0.00 },
      { name: '6 pieces', price: 7.00 },
    ]);

    addGroup('Cheung Fun (Shrimp)', 'Dragon Palace', 'Add-ons', false, null, 1, [
      { name: 'Add Chili Oil', price: 0.00 },
      { name: 'Extra Sweet Soy Sauce', price: 0.00 },
    ]);

    addGroup('Egg Tarts (3 pcs)', 'Dragon Palace', 'Quantity', false, 1, 1, [
      { name: '3 pieces', price: 0.00 },
      { name: '6 pieces', price: 6.00 },
    ]);

    addGroup('West Lake Beef Soup', 'Dragon Palace', 'Size', false, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Large', price: 3.00 },
    ]);
    addGroup('West Lake Beef Soup', 'Dragon Palace', 'Add-ons', false, null, 2, [
      { name: 'Extra Tofu', price: 1.50 },
      { name: 'Add Wontons', price: 3.00 },
    ]);

    addGroup('Buddha Jumps Over the Wall', 'Dragon Palace', 'Add-ons', false, null, 1, [
      { name: 'Extra Mushrooms', price: 4.00 },
    ]);

    addGroup('Whole Steamed Sea Bass', 'Dragon Palace', 'Add-ons', false, null, 1, [
      { name: 'Extra Ginger & Scallion', price: 1.00 },
      { name: 'Add Steamed Rice', price: 2.00 },
    ]);

    addGroup('Salt & Pepper Crab', 'Dragon Palace', 'Add-ons', false, null, 1, [
      { name: 'Add Steamed Buns (for sauce)', price: 3.00 },
      { name: 'Extra Chili & Garlic', price: 0.00 },
    ]);

    addGroup('Mapo Tofu', 'Dragon Palace', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Numbing Hot', price: 0.00 },
    ]);
    addGroup('Mapo Tofu', 'Dragon Palace', 'Protein', true, 1, 2, [
      { name: 'Ground Pork', price: 0.00 },
      { name: 'Ground Beef', price: 1.00 },
      { name: 'Vegetarian (no meat)', price: -1.00 },
    ]);
    addGroup('Mapo Tofu', 'Dragon Palace', 'Add Rice', true, 1, 3, [
      { name: 'No rice', price: 0.00 },
      { name: 'Steamed Rice', price: 2.00 },
    ]);

    addGroup('Beef Ho Fun', 'Dragon Palace', 'Protein', true, 1, 1, [
      { name: 'Beef', price: 0.00 },
      { name: 'Chicken', price: -1.00 },
      { name: 'Shrimp', price: 2.00 },
    ]);
    addGroup('Beef Ho Fun', 'Dragon Palace', 'Style', true, 1, 2, [
      { name: 'Wet (soy sauce)', price: 0.00 },
      { name: 'Dry-tossed', price: 0.00 },
    ]);

    addGroup('Yangzhou Fried Rice', 'Dragon Palace', 'Protein', true, 1, 1, [
      { name: 'Classic Mix (shrimp + char siu)', price: 0.00 },
      { name: 'Shrimp Only', price: 2.00 },
      { name: 'Vegetable', price: -1.00 },
    ]);
    addGroup('Yangzhou Fried Rice', 'Dragon Palace', 'Size', false, 1, 2, [
      { name: 'Regular', price: 0.00 },
      { name: 'Large', price: 3.00 },
    ]);

    // ===== 16. BISTRO LÉON =====
    addGroup('Salade Lyonnaise', 'Bistro Léon', 'Egg', true, 1, 1, [
      { name: 'Poached Egg', price: 0.00 },
      { name: 'No Egg', price: -1.00 },
    ]);
    addGroup('Salade Lyonnaise', 'Bistro Léon', 'Add-ons', false, null, 2, [
      { name: 'Extra Lardons', price: 2.00 },
      { name: 'Extra Croutons', price: 1.00 },
    ]);

    addGroup('Quenelles de Brochet', 'Bistro Léon', 'Add-ons', false, null, 1, [
      { name: 'Extra Nantua Sauce', price: 3.00 },
      { name: 'Extra Baguette', price: 2.00 },
    ]);

    addGroup('Andouillette Grillée', 'Bistro Léon', 'Add-ons', false, null, 1, [
      { name: 'Extra Dijon Mustard', price: 0.00 },
      { name: 'Extra Cornichons', price: 0.00 },
    ]);

    addGroup('Steak Frites', 'Bistro Léon', 'Doneness', true, 1, 1, [
      { name: 'Rare', price: 0.00 },
      { name: 'Medium Rare', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Medium Well', price: 0.00 },
      { name: 'Well Done', price: 0.00 },
    ]);
    addGroup('Steak Frites', 'Bistro Léon', 'Sauce', true, 1, 2, [
      { name: 'Shallot & Red Wine Jus', price: 0.00 },
      { name: 'Béarnaise', price: 0.00 },
      { name: 'Au Poivre', price: 0.00 },
      { name: 'Garlic Butter', price: 0.00 },
    ]);
    addGroup('Steak Frites', 'Bistro Léon', 'Add-ons', false, null, 3, [
      { name: 'Extra Frites', price: 3.00 },
    ]);

    addGroup('Gratin Dauphinois', 'Bistro Léon', 'Size', false, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Large', price: 4.00 },
    ]);
    addGroup('Gratin Dauphinois', 'Bistro Léon', 'Add-ons', false, null, 2, [
      { name: 'Extra Gruyère', price: 2.00 },
    ]);

    addGroup('Poulet Rôti aux Herbes', 'Bistro Léon', 'Side', true, 1, 1, [
      { name: 'Seasonal Vegetables', price: 0.00 },
      { name: 'Gratin Dauphinois', price: 4.00 },
      { name: 'Salade Verte', price: 0.00 },
    ]);
    addGroup('Poulet Rôti aux Herbes', 'Bistro Léon', 'Add-ons', false, null, 2, [
      { name: 'Extra Pan Jus', price: 1.00 },
    ]);

    addGroup('Sole Meunière', 'Bistro Léon', 'Side', true, 1, 1, [
      { name: 'Haricots Verts', price: 0.00 },
      { name: 'Pommes Vapeur', price: 0.00 },
      { name: 'Salade Verte', price: 0.00 },
    ]);
    addGroup('Sole Meunière', 'Bistro Léon', 'Add-ons', false, null, 2, [
      { name: 'Extra Lemon Caper Butter', price: 2.00 },
    ]);

    addGroup('Tarte Tatin', 'Bistro Léon', 'Accompaniment', true, 1, 1, [
      { name: 'Crème Fraîche', price: 0.00 },
      { name: 'Vanilla Ice Cream', price: 0.00 },
      { name: 'Both', price: 1.00 },
    ]);

    addGroup('Profiteroles au Chocolat', 'Bistro Léon', 'Chocolate Sauce', true, 1, 1, [
      { name: 'Valrhona Dark', price: 0.00 },
      { name: 'Milk Chocolate', price: 0.00 },
    ]);
    addGroup('Profiteroles au Chocolat', 'Bistro Léon', 'Add-ons', false, null, 2, [
      { name: 'Extra Chocolate Sauce', price: 2.00 },
      { name: 'Add Whipped Cream', price: 1.00 },
    ]);

    // ===== 17. AEGEAN TABLE =====
    addGroup('Htipiti', 'Aegean Table', 'Heat Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Htipiti', 'Aegean Table', 'Add-ons', false, null, 2, [
      { name: 'Extra Pita Chips', price: 1.00 },
      { name: 'Extra Walnuts', price: 1.00 },
    ]);

    addGroup('Taramosalata', 'Aegean Table', 'Add-ons', false, null, 1, [
      { name: 'Extra Pita', price: 1.00 },
    ]);

    addGroup('Fattoush', 'Aegean Table', 'Add-ons', false, null, 1, [
      { name: 'Add Grilled Chicken', price: 4.00 },
      { name: 'Add Halloumi', price: 3.00 },
    ]);

    addGroup('Spanakopita', 'Aegean Table', 'Quantity', false, 1, 1, [
      { name: '3 pieces', price: 0.00 },
      { name: '6 pieces', price: 9.00 },
    ]);
    addGroup('Spanakopita', 'Aegean Table', 'Add-ons', false, null, 2, [
      { name: 'Add Tzatziki', price: 2.00 },
    ]);

    addGroup('Keftedes', 'Aegean Table', 'Heat Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Keftedes', 'Aegean Table', 'Add-ons', false, null, 2, [
      { name: 'Extra Tomato Sauce', price: 1.00 },
      { name: 'Add Pita', price: 1.00 },
    ]);

    addGroup('Halloumi Saganaki', 'Aegean Table', 'Add-ons', false, null, 1, [
      { name: 'Extra Lemon', price: 0.00 },
      { name: 'Add Pita', price: 1.00 },
    ]);

    addGroup('Moussaka', 'Aegean Table', 'Side', true, 1, 1, [
      { name: 'Greek Salad', price: 0.00 },
      { name: 'Crusty Bread', price: 0.00 },
      { name: 'No Side', price: -2.00 },
    ]);
    addGroup('Moussaka', 'Aegean Table', 'Add-ons', false, null, 2, [
      { name: 'Extra Béchamel', price: 1.00 },
    ]);

    addGroup('Lahmacun', 'Aegean Table', 'Heat Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Lahmacun', 'Aegean Table', 'Quantity', false, 1, 2, [
      { name: '1 piece', price: 0.00 },
      { name: '2 pieces', price: 13.00 },
    ]);
    addGroup('Lahmacun', 'Aegean Table', 'Add-ons', false, null, 3, [
      { name: 'Add Tzatziki', price: 2.00 },
      { name: 'Extra Parsley & Lemon', price: 0.00 },
    ]);

    addGroup('Whole Grilled Octopus', 'Aegean Table', 'Accompaniment', true, 1, 1, [
      { name: 'Fava Purée & Lemon Oil', price: 0.00 },
      { name: 'Add Greek Salad', price: 5.00 },
    ]);
    addGroup('Whole Grilled Octopus', 'Aegean Table', 'Add-ons', false, null, 2, [
      { name: 'Extra Lemon Oil', price: 1.00 },
      { name: 'Extra Capers', price: 0.00 },
    ]);

    addGroup('Galaktoboureko', 'Aegean Table', 'Add-ons', false, null, 1, [
      { name: 'Add Vanilla Ice Cream', price: 3.00 },
      { name: 'Extra Orange Blossom Syrup', price: 0.00 },
    ]);

    // ===== 18. HANGANG BBQ =====
    addGroup('Sundubu Jjigae', 'Hangang BBQ', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Sundubu Jjigae', 'Hangang BBQ', 'Protein', true, 1, 2, [
      { name: 'Clams + Pork', price: 0.00 },
      { name: 'Seafood Mix', price: 3.00 },
      { name: 'Tofu Only', price: -2.00 },
    ]);
    addGroup('Sundubu Jjigae', 'Hangang BBQ', 'Add-ons', false, null, 3, [
      { name: 'Extra Tofu', price: 1.50 },
      { name: 'Add Kimchi', price: 1.50 },
    ]);

    addGroup('Pajeon', 'Hangang BBQ', 'Filling', true, 1, 1, [
      { name: 'Mixed Seafood', price: 0.00 },
      { name: 'Kimchi', price: 0.00 },
      { name: 'Plain Scallion', price: -1.00 },
    ]);

    addGroup('Banchan Platter', 'Hangang BBQ', 'Add-ons', false, null, 1, [
      { name: 'Extra Kimchi', price: 2.00 },
      { name: 'Extra Pickled Radish', price: 1.00 },
    ]);

    addGroup('Hangang Premium Set (2 ppl)', 'Hangang BBQ', 'Add-ons', false, null, 1, [
      { name: 'Extra Galbi (2 pcs)', price: 12.00 },
      { name: 'Extra Pork Belly', price: 7.00 },
    ]);

    addGroup('Wagyu Short Rib', 'Hangang BBQ', 'Make it a Meal', true, 1, 1, [
      { name: 'Wagyu only', price: 0.00 },
      { name: 'Add Steamed Rice + Banchan', price: 6.00 },
    ]);
    addGroup('Wagyu Short Rib', 'Hangang BBQ', 'Add-ons', false, null, 2, [
      { name: 'Extra Wagyu (2 pcs)', price: 15.00 },
    ]);

    addGroup('Spicy Pork Bulgogi', 'Hangang BBQ', 'Spice Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Spicy Pork Bulgogi', 'Hangang BBQ', 'Make it a Meal', true, 1, 2, [
      { name: 'Pork Bulgogi only', price: 0.00 },
      { name: 'Add Steamed Rice + Banchan', price: 4.00 },
    ]);
    addGroup('Spicy Pork Bulgogi', 'Hangang BBQ', 'Add-ons', false, null, 3, [
      { name: 'Add Kimchi', price: 2.00 },
      { name: 'Extra Gochujang', price: 0.00 },
    ]);

    addGroup('Doenjang Jjigae', 'Hangang BBQ', 'Protein', true, 1, 1, [
      { name: 'Tofu + Mushrooms', price: 0.00 },
      { name: 'Add Beef', price: 3.00 },
      { name: 'Add Clams', price: 4.00 },
    ]);

    addGroup('Mul Naengmyeon', 'Hangang BBQ', 'Add-ons', false, null, 1, [
      { name: 'Extra Beef Slices', price: 4.00 },
      { name: 'Add Gochugaru (spicy)', price: 0.00 },
      { name: 'Extra Mustard', price: 0.00 },
    ]);

    addGroup('Bingsu (Mango)', 'Hangang BBQ', 'Flavor', true, 1, 1, [
      { name: 'Mango', price: 0.00 },
      { name: 'Strawberry', price: 0.00 },
      { name: 'Matcha', price: 0.00 },
      { name: 'Injeolmi (Roasted Soybean)', price: 0.00 },
    ]);
    addGroup('Bingsu (Mango)', 'Hangang BBQ', 'Add-ons', false, null, 2, [
      { name: 'Extra Mochi', price: 1.00 },
      { name: 'Add Ice Cream Scoop', price: 2.00 },
    ]);

    // ===== 19. SIAM STREET =====
    addGroup('Miang Kham', 'Siam Street', 'Heat Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Miang Kham', 'Siam Street', 'Add-ons', false, null, 2, [
      { name: 'Extra Dried Shrimp', price: 1.00 },
      { name: 'Extra Peanuts', price: 0.50 },
    ]);

    addGroup('Sai Oua', 'Siam Street', 'Quantity', false, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Double Portion', price: 11.00 },
    ]);
    addGroup('Sai Oua', 'Siam Street', 'Add-ons', false, null, 2, [
      { name: 'Add Sticky Rice', price: 2.00 },
      { name: 'Add Nam Prik Noom (green chili dip)', price: 1.00 },
    ]);

    addGroup('Tod Mun Pla', 'Siam Street', 'Heat Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Extra Spicy', price: 0.00 },
    ]);
    addGroup('Tod Mun Pla', 'Siam Street', 'Add-ons', false, null, 2, [
      { name: 'Extra Cucumber Relish', price: 1.00 },
    ]);

    addGroup('Tom Kha Gai', 'Siam Street', 'Spice Level', true, 1, 1, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Tom Kha Gai', 'Siam Street', 'Protein', true, 1, 2, [
      { name: 'Chicken', price: 0.00 },
      { name: 'Shrimp', price: 3.00 },
      { name: 'Tofu', price: -1.00 },
    ]);
    addGroup('Tom Kha Gai', 'Siam Street', 'Add-ons', false, null, 3, [
      { name: 'Extra Coconut Milk', price: 1.00 },
    ]);

    addGroup('Som Tum Isaan', 'Siam Street', 'Spice Level', true, 1, 1, [
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot (Isaan style)', price: 0.00 },
    ]);
    addGroup('Som Tum Isaan', 'Siam Street', 'Add-ons', false, null, 2, [
      { name: 'Extra Fermented Crab', price: 2.00 },
      { name: 'Extra Peanuts', price: 1.00 },
    ]);

    addGroup('Gaeng Tai Pla', 'Siam Street', 'Spice Level', true, 1, 1, [
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot', price: 0.00 },
    ]);
    addGroup('Gaeng Tai Pla', 'Siam Street', 'Accompaniment', true, 1, 2, [
      { name: 'Curry only', price: 0.00 },
      { name: 'Add Steamed Jasmine Rice', price: 3.00 },
    ]);

    addGroup('Khao Soi', 'Siam Street', 'Protein', true, 1, 1, [
      { name: 'Braised Chicken', price: 0.00 },
      { name: 'Braised Beef', price: 2.00 },
      { name: 'Tofu', price: -1.00 },
    ]);
    addGroup('Khao Soi', 'Siam Street', 'Spice Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Khao Soi', 'Siam Street', 'Add-ons', false, null, 3, [
      { name: 'Extra Crispy Noodles', price: 1.00 },
      { name: 'Extra Coconut Curry Broth', price: 2.00 },
    ]);

    addGroup('Phat Kraphao Moo Saap', 'Siam Street', 'Protein', true, 1, 1, [
      { name: 'Pork', price: 0.00 },
      { name: 'Chicken', price: 0.00 },
      { name: 'Beef', price: 2.00 },
      { name: 'Tofu', price: -1.00 },
    ]);
    addGroup('Phat Kraphao Moo Saap', 'Siam Street', 'Spice Level', true, 1, 2, [
      { name: 'Medium', price: 0.00 },
      { name: 'Hot', price: 0.00 },
      { name: 'Extra Hot (Thai hot)', price: 0.00 },
    ]);
    addGroup('Phat Kraphao Moo Saap', 'Siam Street', 'Egg', true, 1, 3, [
      { name: 'Crispy Fried Egg', price: 0.00 },
      { name: 'No Egg', price: 0.00 },
    ]);
    addGroup('Phat Kraphao Moo Saap', 'Siam Street', 'Add-ons', false, null, 4, [
      { name: 'Add Jasmine Rice', price: 2.00 },
    ]);

    addGroup('Bua Loi', 'Siam Street', 'Add-ons', false, null, 1, [
      { name: 'Extra Coconut Milk', price: 0.50 },
      { name: 'Add Pandan Jelly', price: 1.00 },
    ]);

    addGroup('Khanom Krok', 'Siam Street', 'Quantity', false, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Double Portion', price: 6.00 },
    ]);

    // ===== 20. PIT STOP BBQ =====
    addGroup('Burnt End Bites', 'Pit Stop BBQ', 'Sauce', true, 1, 1, [
      { name: 'House BBQ Sauce', price: 0.00 },
      { name: 'Spicy BBQ Sauce', price: 0.00 },
      { name: 'No Sauce (dry)', price: 0.00 },
    ]);
    addGroup('Burnt End Bites', 'Pit Stop BBQ', 'Add-ons', false, null, 2, [
      { name: 'Extra Sauce', price: 0.00 },
    ]);

    addGroup('Smoked Wings (8 pcs)', 'Pit Stop BBQ', 'Sauce', true, 1, 1, [
      { name: 'Alabama White Sauce', price: 0.00 },
      { name: 'Classic BBQ', price: 0.00 },
      { name: 'Spicy BBQ', price: 0.00 },
      { name: 'Dry Rub Only', price: 0.00 },
    ]);
    addGroup('Smoked Wings (8 pcs)', 'Pit Stop BBQ', 'Heat Level', true, 1, 2, [
      { name: 'Mild', price: 0.00 },
      { name: 'Regular', price: 0.00 },
      { name: 'Hot', price: 0.00 },
    ]);
    addGroup('Smoked Wings (8 pcs)', 'Pit Stop BBQ', 'Quantity', false, 1, 3, [
      { name: '8 pieces', price: 0.00 },
      { name: '16 pieces', price: 13.00 },
    ]);

    addGroup('Pimento Cheese Dip', 'Pit Stop BBQ', 'Heat Level', true, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Spicy (extra jalapeño)', price: 0.00 },
    ]);
    addGroup('Pimento Cheese Dip', 'Pit Stop BBQ', 'Add-ons', false, null, 2, [
      { name: 'Extra Smoked Crackers', price: 1.50 },
      { name: 'Add Pulled Pork', price: 4.00 },
    ]);

    addGroup('Brisket Plate', 'Pit Stop BBQ', 'Brisket Cut', true, 1, 1, [
      { name: 'Lean', price: 0.00 },
      { name: 'Fatty', price: 0.00 },
      { name: 'Mixed', price: 0.00 },
    ]);
    addGroup('Brisket Plate', 'Pit Stop BBQ', 'Sides (choose 2)', true, 2, 2, [
      { name: 'Smoked Mac & Cheese', price: 0.00 },
      { name: 'Coleslaw', price: 0.00 },
      { name: 'Baked Beans', price: 0.00 },
      { name: 'Jalapeño Cornbread', price: 0.00 },
      { name: 'Potato Salad', price: 0.00 },
    ]);
    addGroup('Brisket Plate', 'Pit Stop BBQ', 'Add-ons', false, null, 3, [
      { name: 'Extra Pickles', price: 0.00 },
      { name: 'Extra BBQ Sauce', price: 0.00 },
    ]);

    addGroup('St. Louis Ribs (Full Rack)', 'Pit Stop BBQ', 'BBQ Sauce', true, 1, 1, [
      { name: 'Tangy BBQ', price: 0.00 },
      { name: 'Sweet BBQ', price: 0.00 },
      { name: 'Spicy BBQ', price: 0.00 },
      { name: 'Dry Rub Only', price: 0.00 },
    ]);
    addGroup('St. Louis Ribs (Full Rack)', 'Pit Stop BBQ', 'Add-ons', false, null, 2, [
      { name: 'Extra BBQ Sauce', price: 0.00 },
      { name: 'Add Jalapeño Cornbread', price: 3.00 },
    ]);

    addGroup('Pulled Pork Sandwich', 'Pit Stop BBQ', 'Make it a Meal', true, 1, 1, [
      { name: 'Sandwich only', price: 0.00 },
      { name: 'Add One Side', price: 4.00 },
      { name: 'Add Two Sides', price: 7.00 },
    ]);
    addGroup('Pulled Pork Sandwich', 'Pit Stop BBQ', 'Heat Level', true, 1, 2, [
      { name: 'Regular (vinegar slaw)', price: 0.00 },
      { name: 'Add Hot Sauce', price: 0.00 },
    ]);
    addGroup('Pulled Pork Sandwich', 'Pit Stop BBQ', 'Add-ons', false, null, 3, [
      { name: 'Extra Pulled Pork', price: 5.00 },
      { name: 'Extra Coleslaw', price: 0.00 },
    ]);

    addGroup('Pitmaster\'s Platter (2 ppl)', 'Pit Stop BBQ', 'Add-ons', false, null, 1, [
      { name: 'Extra Cornbread', price: 2.00 },
      { name: 'Extra BBQ Sauce', price: 0.00 },
    ]);

    addGroup('Smoked Mac & Cheese', 'Pit Stop BBQ', 'Size', false, 1, 1, [
      { name: 'Regular', price: 0.00 },
      { name: 'Large', price: 4.00 },
    ]);
    addGroup('Smoked Mac & Cheese', 'Pit Stop BBQ', 'Add-ons', false, null, 2, [
      { name: 'Add Pulled Pork', price: 4.00 },
      { name: 'Add Jalapeños', price: 0.00 },
    ]);

    addGroup('Jalapeño Cornbread', 'Pit Stop BBQ', 'Add-ons', false, null, 1, [
      { name: 'Extra Honey Butter', price: 0.00 },
    ]);

    addGroup('Banana Pudding', 'Pit Stop BBQ', 'Add-ons', false, null, 1, [
      { name: 'Extra Toasted Meringue', price: 0.00 },
      { name: 'Add Whipped Cream', price: 1.00 },
    ]);

    addGroup('Peach Cobbler', 'Pit Stop BBQ', 'Add-ons', false, null, 1, [
      { name: 'Extra Vanilla Ice Cream', price: 2.00 },
      { name: 'Extra Peach Filling', price: 2.00 },
    ]);

  });

  seed();
}

export function seedReviews(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment, reviewer_name, created_at)
    VALUES (NULL, ?, NULL, ?, ?, ?, datetime('now', ? || ' days'))
  `);

  const data: Array<{ restaurantId: number; reviews: Array<{ rating: number; comment: string; name: string; daysAgo: number }> }> = [
    // 1. Bella Napoli
    { restaurantId: 1, reviews: [
      { rating: 5, comment: "The Margherita pizza is pure perfection — thin charred crust with the freshest mozzarella. Transported me straight to Naples.", name: "Sarah M.", daysAgo: 2 },
      { rating: 5, comment: "Carbonara arrived at exactly the right temperature with a silky sauce. You can taste the quality of the guanciale. Exceptional.", name: "James T.", daysAgo: 5 },
      { rating: 5, comment: "Tiramisu is the best I've had outside of Italy. Perfectly soaked ladyfingers, not too sweet. Absolutely divine.", name: "Michael R.", daysAgo: 10 },
      { rating: 4, comment: "Burrata was unbelievably creamy and the prosciutto was paper-thin perfection. Really excellent, delivery was fast too.", name: "Emma L.", daysAgo: 14 },
      { rating: 4, comment: "The Diavola had a beautiful kick and the wood-fired crust was genuinely special. Will order again for sure.", name: "Lisa C.", daysAgo: 19 },
      { rating: 3, comment: "Pizza was good but arrived a bit lukewarm. The flavors were there though. Would try pickup next time.", name: "Tom H.", daysAgo: 25 },
      { rating: 3, comment: "Solid Italian food — nothing revolutionary but reliably good. The carbonara was a touch too salty for my taste.", name: "Priya S.", daysAgo: 31 },
      { rating: 2, comment: "Waited over an hour for delivery and the pasta was overcooked and clumped together by then. Disappointing for the price.", name: "Ryan P.", daysAgo: 38 },
      { rating: 1, comment: "Order completely wrong — got someone else's pizza with meat even though I'm vegetarian. Customer service didn't help resolve it.", name: "Sophie W.", daysAgo: 45 },
      { rating: 4, comment: "Pappardelle ragù was rich and hearty. Huge portions too. My go-to Italian spot now.", name: "Anthony B.", daysAgo: 52 },
    ]},
    // 2. Sakura Garden
    { restaurantId: 2, reviews: [
      { rating: 5, comment: "The dragon roll was absolutely stunning — perfectly balanced flavors and arrived in beautiful presentation. Best sushi delivery I've tried.", name: "David K.", daysAgo: 3 },
      { rating: 5, comment: "Tonkotsu ramen broth was rich, milky, and clearly made from scratch. The chashu pork melted in my mouth. Incredible.", name: "Amy N.", daysAgo: 8 },
      { rating: 5, comment: "Matcha cheesecake was an absolute revelation — creamy, aromatic, and not overly sweet. Will order just for that.", name: "Sophie W.", daysAgo: 14 },
      { rating: 4, comment: "Really fresh sashimi. The salmon was incredibly silky. Docking a star only because the miso soup arrived slightly cold.", name: "Ryan P.", daysAgo: 20 },
      { rating: 4, comment: "Gyoza were perfectly crispy with juicy filling. The yuzu ponzu dipping sauce was a lovely touch. Really good.", name: "Tom H.", daysAgo: 27 },
      { rating: 3, comment: "Decent sushi but nothing mind-blowing for the price. Fish was fresh though and delivery was prompt.", name: "Nadia C.", daysAgo: 34 },
      { rating: 3, comment: "Average ramen — broth was a bit thin compared to what you'd get in a proper ramen shop. Fine for delivery.", name: "Frank D.", daysAgo: 41 },
      { rating: 2, comment: "Rice in my nigiri was too warm and falling apart. Didn't feel great eating warm sushi. Flavors were okay though.", name: "Claire F.", daysAgo: 50 },
    ]},
    // 3. Casa Fuego
    { restaurantId: 3, reviews: [
      { rating: 5, comment: "Al pastor tacos are simply the best in the city. The pineapple-marinated pork is incredible and the tortillas are hand-pressed. Perfection.", name: "Carlos M.", daysAgo: 2 },
      { rating: 5, comment: "Birria tacos with the consommé for dipping arrived perfectly packaged. The cheese pull was real. Outstanding.", name: "Jessica R.", daysAgo: 6 },
      { rating: 5, comment: "Churros arrived crispy and warm — the Mexican chocolate sauce was deeply complex. Best churros outside Mexico City.", name: "Derek L.", daysAgo: 11 },
      { rating: 5, comment: "Veggie burrito was loaded with fresh roasted vegetables and the salsa verde had real heat. Great vegetarian option.", name: "Natalie G.", daysAgo: 16 },
      { rating: 4, comment: "Great burrito — generously filled with quality carne asada, fresh guacamole, and proper black beans. Solid.", name: "Marco V.", daysAgo: 22 },
      { rating: 4, comment: "Guacamole was made fresh and perfectly seasoned with lime. Chips stayed crispy somehow. Impressive packaging.", name: "Brianna T.", daysAgo: 28 },
      { rating: 3, comment: "Tacos were tasty but smaller than expected for the price. Salsa verde had good flavor though. Average overall.", name: "Omar A.", daysAgo: 34 },
      { rating: 3, comment: "Decent Mexican food. The carnitas were a bit dry but the toppings helped. Not bad but not amazing.", name: "Hannah B.", daysAgo: 42 },
      { rating: 2, comment: "My order arrived missing an item and the rice was hard. Not great for the price point. Disappointing.", name: "Vikram N.", daysAgo: 50 },
      { rating: 1, comment: "Food was cold and tasted like it had been sitting for a while. Tortillas were stiff and flavorless. Won't order again.", name: "Linda C.", daysAgo: 58 },
      { rating: 4, comment: "Tres leches cake was a wonderful end to the meal — soaked perfectly and topped with fresh cream. Loved it.", name: "Grace Y.", daysAgo: 65 },
      { rating: 4, comment: "Elote en vaso is addictive. Great depth of flavor from the cotija and chili. Really solid across the board.", name: "Kevin W.", daysAgo: 72 },
    ]},
    // 4. Spice Route
    { restaurantId: 4, reviews: [
      { rating: 5, comment: "Butter chicken was absolutely divine — the sauce was silky, aromatic, and perfectly spiced. Best I've had outside Mumbai.", name: "Anita P.", daysAgo: 3 },
      { rating: 5, comment: "Lamb rogan josh was a masterpiece. The slow-cooked meat fell apart and the spice blend was complex and beautiful.", name: "Raj K.", daysAgo: 9 },
      { rating: 4, comment: "Really good biryani with fragrant saffron rice and well-seasoned chicken. The garlic naan was pillowy perfection.", name: "Claire F.", daysAgo: 16 },
      { rating: 4, comment: "Paneer tikka was beautifully charred and the marinade had real depth. Great appetizer. Will definitely reorder.", name: "Omar A.", daysAgo: 23 },
      { rating: 3, comment: "Tikka masala was fine — a bit safe and mild compared to what I was hoping for. The naan was excellent though.", name: "Hannah B.", daysAgo: 30 },
      { rating: 2, comment: "Delivery was extremely late and the food arrived cold. The curry was good in flavor but it's hard to enjoy cold Indian food.", name: "Steven J.", daysAgo: 40 },
      { rating: 1, comment: "Way too bland — no heat whatsoever. Asked for spicy and got something that tasted like tomato soup. Very disappointing.", name: "Grace Y.", daysAgo: 52 },
    ]},
    // 5. Golden Dragon
    { restaurantId: 5, reviews: [
      { rating: 5, comment: "Dim sum is the real deal — har gow wrappers were translucent and delicate, the siu mai were plump. Outstanding quality.", name: "Mei L.", daysAgo: 4 },
      { rating: 5, comment: "Peking duck was incredible — that lacquered skin arrived crispy somehow. The pancakes and hoisin made it sing.", name: "Linda C.", daysAgo: 9 },
      { rating: 5, comment: "Beef chow fun had incredible wok hei — you could taste the fire. This is the real stuff, not the Americanized version.", name: "Kevin W.", daysAgo: 15 },
      { rating: 4, comment: "Kung pao chicken had a great balance of heat, sweetness, and crunch. Generous portions too. Solid Chinese food.", name: "Frank D.", daysAgo: 21 },
      { rating: 4, comment: "Hot and sour soup was bold, tangy, and deeply comforting. The wonton soup was clean and flavorful.", name: "Grace Y.", daysAgo: 28 },
      { rating: 3, comment: "Good dim sum but arrived a bit cool. Some items were better than others. The BBQ pork bao was excellent though.", name: "Steven J.", daysAgo: 35 },
      { rating: 3, comment: "Average fried rice — not bad, not memorable. The spring rolls were decent. Nothing special here.", name: "Isabelle D.", daysAgo: 43 },
      { rating: 2, comment: "Ordered mapo tofu and it arrived way too watery. The flavor was there but the texture was completely wrong.", name: "Pierre M.", daysAgo: 52 },
      { rating: 1, comment: "Order was wrong, waited an hour, and when it arrived the noodles were mushy. Very disappointing experience.", name: "Charlotte B.", daysAgo: 62 },
    ]},
    // 6. Le Petit Bistro
    { restaurantId: 6, reviews: [
      { rating: 5, comment: "Steak frites was absolutely impeccable — the bavette was tender, the frites crispy, and the béarnaise was flawless. Bravo.", name: "Isabelle D.", daysAgo: 3 },
      { rating: 5, comment: "Bouillabaisse arrived in a thermal container still bubbling. The saffron broth was extraordinary. Felt like being in Marseille.", name: "Pierre M.", daysAgo: 8 },
      { rating: 5, comment: "Chocolate fondant had a perfectly molten center and the vanilla ice cream alongside was exceptional. A perfect finish.", name: "William F.", daysAgo: 14 },
      { rating: 4, comment: "Crème brûlée had a perfect caramel crust. The custard was silky and lightly scented with vanilla. Wonderful dessert.", name: "Charlotte B.", daysAgo: 20 },
      { rating: 3, comment: "French onion soup was good but the bread got soggy in delivery. Flavors were authentic though. Mixed experience.", name: "Camille R.", daysAgo: 28 },
      { rating: 2, comment: "Expensive for the portion sizes and the sole arrived overcooked and dry. Expected much more for the price.", name: "Étienne L.", daysAgo: 38 },
    ]},
    // 7. Olive & Sea
    { restaurantId: 7, reviews: [
      { rating: 5, comment: "The mezze platter is the most generous and authentic I've found anywhere. Everything from the hummus to the falafel was exceptional.", name: "Sophia K.", daysAgo: 2 },
      { rating: 5, comment: "Lamb souvlaki was beautifully marinated and the tzatziki was made with real strained yogurt. Superb.", name: "Yasmin A.", daysAgo: 6 },
      { rating: 5, comment: "Falafel bowl with saffron rice was an incredibly satisfying vegetarian meal. Everything was fresh and vibrant.", name: "Elena V.", daysAgo: 11 },
      { rating: 4, comment: "Grilled branzino was perfectly cooked and the herb oil was fragrant and bright. One of my favorite deliveries ever.", name: "Nicholas P.", daysAgo: 17 },
      { rating: 4, comment: "Hummus is the real deal — smooth, well-seasoned, with a good olive oil drizzle. Warm pita was a nice touch.", name: "George T.", daysAgo: 23 },
      { rating: 4, comment: "Baklava was crispy, honeyed, and not overly sweet. The filo layers were delicate. Great dessert.", name: "Hassan R.", daysAgo: 30 },
      { rating: 4, comment: "Shrimp saganaki was rich and saucy with good feta. Really delicious for a cold evening. Will order again.", name: "Omar A.", daysAgo: 37 },
      { rating: 3, comment: "Calamari was a bit chewy which is disappointing. The accompanying sauce was nice though. Inconsistent quality.", name: "Anita P.", daysAgo: 44 },
      { rating: 3, comment: "Kibbeh were okay but a bit greasy. The hummus and pita were the highlights for me. Mixed experience.", name: "Raj K.", daysAgo: 52 },
      { rating: 2, comment: "Spanakopita phyllo was completely soggy from condensation — a packaging problem. Filing was tasty but texturally ruined.", name: "Claire F.", daysAgo: 61 },
      { rating: 1, comment: "Order arrived missing half the mezze items and the restaurant was unresponsive when I tried to contact them.", name: "Vikram N.", daysAgo: 72 },
    ]},
    // 8. Seoul Kitchen
    { restaurantId: 8, reviews: [
      { rating: 5, comment: "Best bibimbap I've had outside of Seoul. The stone pot effect was replicated beautifully — crispy rice bottom and all.", name: "Jisoo L.", daysAgo: 4 },
      { rating: 5, comment: "Japchae noodles were beautifully seasoned and loaded with vegetables. The best Korean glass noodle dish I've had delivered.", name: "Min J.", daysAgo: 11 },
      { rating: 4, comment: "Tteokbokki arrived bubbling in a great gochujang sauce. Chewy rice cakes were perfectly cooked. Good stuff.", name: "Chris O.", daysAgo: 19 },
      { rating: 3, comment: "Decent Korean food but the banchan were minimal. Bulgogi was tasty though. Average delivery experience.", name: "Rachel S.", daysAgo: 28 },
      { rating: 2, comment: "The galbi was overpriced for the amount received. Tough and not particularly flavorful. Disappointing.", name: "Daniel Y.", daysAgo: 40 },
    ]},
    // 9. Thai Orchid
    { restaurantId: 9, reviews: [
      { rating: 5, comment: "Pad Thai is an absolute masterpiece — perfectly balanced sweet, sour, and salty. The texture of the noodles was flawless.", name: "Malee S.", daysAgo: 2 },
      { rating: 5, comment: "Green curry was aromatic, creamy, and had beautiful depth. The bamboo shoots and Thai eggplant added great texture.", name: "Jason W.", daysAgo: 5 },
      { rating: 5, comment: "Tom yum goong was explosively flavorful — sour, spicy, and fragrant with real lemongrass and galangal. Outstanding.", name: "Nadia C.", daysAgo: 9 },
      { rating: 5, comment: "Miang kham was unlike anything I've had delivered before. Such a unique and delicious combination of flavors.", name: "Robert T.", daysAgo: 13 },
      { rating: 4, comment: "Massaman curry was rich and warming. The potatoes were creamy and the beef tender. A minor complaint: slightly oily.", name: "Alicia H.", daysAgo: 18 },
      { rating: 4, comment: "Satay chicken was well marinated and the peanut sauce was thick and deeply flavored. Great starter.", name: "Ben M.", daysAgo: 23 },
      { rating: 4, comment: "Som tum papaya salad was fresh and fiery. The balance of flavors was excellent. Really loved it.", name: "Camille R.", daysAgo: 29 },
      { rating: 4, comment: "Green curry was excellent and the jasmine rice was perfectly cooked. Good portion sizes too.", name: "Étienne L.", daysAgo: 35 },
      { rating: 3, comment: "Basil stir-fry was okay — a bit too sweet for my taste. Not bad, just not what I was hoping for.", name: "Sophia K.", daysAgo: 42 },
      { rating: 3, comment: "Mango sticky rice was good but the mango wasn't quite ripe enough. The rice itself was good though.", name: "Yasmin A.", daysAgo: 49 },
      { rating: 3, comment: "Spring rolls were fine — crispy but a bit bland inside. The sweet chili sauce saved them. Average.", name: "George T.", daysAgo: 57 },
      { rating: 2, comment: "Tom kha was thin and coconut milk seemed watered down. Not the fragrant, rich soup I was expecting.", name: "Hassan R.", daysAgo: 66 },
      { rating: 2, comment: "Delivery took 75 minutes and everything was cold. The flavors were probably decent but hard to tell.", name: "Nicholas P.", daysAgo: 76 },
      { rating: 1, comment: "Wrong order delivered. Got something completely different. No response from the restaurant. Terrible experience.", name: "Elena V.", daysAgo: 88 },
    ]},
    // 10. The American Grill
    { restaurantId: 10, reviews: [
      { rating: 5, comment: "The smash burger is one of the best burgers I've had — crispy lacey edges, juicy center, and that special sauce is incredible.", name: "Tyler B.", daysAgo: 3 },
      { rating: 5, comment: "BBQ ribs were fall-off-the-bone tender with a bark that would make Texas proud. Incredible from a delivery service.", name: "Ashley M.", daysAgo: 7 },
      { rating: 5, comment: "Chicken and waffles with that maple syrup and hot sauce combo was absolutely amazing. Sweet, savory, crispy perfection.", name: "Megan T.", daysAgo: 13 },
      { rating: 4, comment: "Buffalo wings were properly crispy and the sauce had a real kick. Blue cheese dip was housemade and excellent.", name: "Brandon K.", daysAgo: 19 },
      { rating: 4, comment: "The Philly cheesesteak was loaded with properly seasoned ribeye and the provolone was melted perfectly. Solid.", name: "Kayla R.", daysAgo: 26 },
      { rating: 3, comment: "Classic smash burger was good but nothing that blew me away. Fries arrived a bit soft. Decent comfort food.", name: "Josh L.", daysAgo: 33 },
      { rating: 3, comment: "Mac and cheese bites were fine — a bit heavy. The cheesecake was the highlight of the order actually.", name: "Brianna T.", daysAgo: 41 },
      { rating: 2, comment: "Ordered my steak medium-rare and it arrived well done. Completely different experience than expected. Disappointing.", name: "Derek L.", daysAgo: 51 },
      { rating: 1, comment: "Food was cold, burger was soggy, and the fries were limp. Paid premium prices for average fast food quality. Never again.", name: "Natalie G.", daysAgo: 63 },
    ]},
  ];

  const seedAll = db.transaction(() => {
    for (const restaurant of data) {
      for (const review of restaurant.reviews) {
        insert.run(
          restaurant.restaurantId,
          review.rating,
          review.comment,
          review.name,
          `-${review.daysAgo}`
        );
      }
    }
  });

  seedAll();
}

export function seedAdditionalRestaurants(db: Database.Database) {
  const insertRestaurant = db.prepare(`
    INSERT INTO restaurants (name, cuisine, description, image_url, rating, delivery_fee, delivery_min, delivery_max, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (restaurant_id, category, name, description, price, image_url, is_available)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const seedAll = db.transaction(() => {
    // 11. Trattoria Roma - Italian
    const trattoria = insertRestaurant.run('Trattoria Roma', 'Italian', 'A rustic Roman trattoria serving classic recipes passed down through generations. From creamy cacio e pepe to slow-braised oxtail, every dish is a love letter to the Eternal City.', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', 4.6, 3.49, 30, 50, '4072 18th St, San Francisco, CA 94114');
    const tratId = trattoria.lastInsertRowid as number;
    insertMenuItem.run(tratId, 'Antipasti', 'Supplì al Telefono', 'Roman-style fried rice croquettes stuffed with ragù and mozzarella, served with tomato dipping sauce', 9.99, 'https://images.unsplash.com/photo-1621956838481-b8b7b3be7e5e?w=400&q=80');
    insertMenuItem.run(tratId, 'Antipasti', 'Fiori di Zucca Fritti', 'Tempura-battered zucchini blossoms stuffed with ricotta and anchovy, fried to golden perfection', 12.99, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80');
    insertMenuItem.run(tratId, 'Antipasti', 'Bruschetta con Fegatini', 'Grilled bread topped with chicken liver pâté, capers, and fresh sage', 10.99, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80');
    insertMenuItem.run(tratId, 'Risotto', 'Risotto alla Milanese', 'Saffron-infused Arborio rice with bone marrow, Parmigiano-Reggiano, and a knob of butter', 21.99, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80');
    insertMenuItem.run(tratId, 'Risotto', 'Risotto ai Funghi Porcini', 'Creamy risotto with fresh and dried porcini mushrooms, white wine, and aged Pecorino', 19.99, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80');
    insertMenuItem.run(tratId, 'Pasta', 'Cacio e Pepe', 'Tonnarelli pasta tossed with Pecorino Romano, Parmigiano, and freshly cracked black pepper — Roman perfection', 17.99, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80');
    insertMenuItem.run(tratId, 'Pasta', 'Bucatini all\'Amatriciana', 'Thick hollow pasta with guanciale, San Marzano tomatoes, Pecorino Romano, and chili', 18.99, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80');
    insertMenuItem.run(tratId, 'Pasta', 'Gnocchi alla Romana', 'Baked semolina gnocchi with butter, sage, and Parmigiano crust — not your average gnocchi', 16.99, 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80');
    insertMenuItem.run(tratId, 'Dolci', 'Crostata di Ricotta', 'Classic Roman ricotta tart with candied orange peel and a shortcrust pastry shell', 8.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');
    insertMenuItem.run(tratId, 'Dolci', 'Semifreddo al Torroncino', 'Frozen nougat semifreddo with honey, almonds, and a drizzle of bitter caramel', 7.99, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80');

    // 12. Ramen Kazu - Japanese
    const ramenKazu = insertRestaurant.run('Ramen Kazu', 'Japanese', 'Tokyo-trained chef Kazu brings authentic Japanese ramen to San Francisco. Rich tonkotsu broths, perfectly springy noodles, and creative toppings crafted with obsessive attention to detail.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80', 4.7, 2.49, 20, 35, '175 2nd St, San Francisco, CA 94105');
    const kazuId = ramenKazu.lastInsertRowid as number;
    insertMenuItem.run(kazuId, 'Starters', 'Gyoza (6 pcs)', 'Pan-fried pork and cabbage dumplings with crispy skirt, served with yuzu ponzu', 8.99, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80');
    insertMenuItem.run(kazuId, 'Starters', 'Karaage Chicken', 'Japanese fried chicken thighs marinated in soy, ginger, and sake — crispy, juicy, and addictive', 11.99, 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80');
    insertMenuItem.run(kazuId, 'Starters', 'Takoyaki (6 pcs)', 'Osaka-style octopus balls topped with bonito flakes, mayo, and okonomiyaki sauce', 9.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80');
    insertMenuItem.run(kazuId, 'Ramen', 'Tonkotsu Ramen', '18-hour pork bone broth, chashu pork belly, soft egg, bamboo shoots, nori, and green onion', 17.99, 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&q=80');
    insertMenuItem.run(kazuId, 'Ramen', 'Spicy Miso Ramen', 'Rich miso broth with chili oil, ground pork, corn, butter, and a perfectly soft-boiled egg', 18.99, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80');
    insertMenuItem.run(kazuId, 'Ramen', 'Shoyu Ramen', 'Clear soy-seasoned chicken broth with chicken chashu, menma, yuzu, and thin noodles', 16.99, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80');
    insertMenuItem.run(kazuId, 'Ramen', 'Vegan Shio Ramen', 'Delicate salt-based kombu and shiitake broth with tofu, roasted vegetables, and sesame oil', 15.99, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80');
    insertMenuItem.run(kazuId, 'Rice Bowls', 'Chashu Don', 'Soy-glazed pork belly over steamed rice with pickled ginger, sesame, and soft egg', 14.99, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80');
    insertMenuItem.run(kazuId, 'Rice Bowls', 'Salmon Ikura Don', 'Sashimi-grade salmon over seasoned rice topped with salmon roe and shiso', 19.99, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80');

    // 13. El Taquero - Mexican
    const elTaquero = insertRestaurant.run('El Taquero', 'Mexican', 'Street-style tacos and bold Mexican flavors inspired by the taquerias of Mexico City. Everything is made fresh daily — from hand-pressed tortillas to slow-cooked meats simmered with dried chiles and spices.', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80', 4.5, 1.99, 15, 30, '2400 Mission St, San Francisco, CA 94110');
    const taqueroId = elTaquero.lastInsertRowid as number;
    insertMenuItem.run(taqueroId, 'Antojitos', 'Queso Fundido', 'Melted Oaxacan cheese with chorizo and roasted peppers, served with fresh tortillas', 10.99, 'https://images.unsplash.com/photo-1564844536311-de546a28c87d?w=400&q=80');
    insertMenuItem.run(taqueroId, 'Antojitos', 'Tostadas de Tinga', 'Crispy tostadas with shredded chipotle chicken, crema, avocado, and queso fresco', 9.99, 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&q=80');
    insertMenuItem.run(taqueroId, 'Antojitos', 'Sopa de Lima', 'Yucatecan lime soup with shredded chicken, crispy tortilla strips, and fresh cilantro', 8.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80');
    insertMenuItem.run(taqueroId, 'Tacos', 'Taco de Birria', 'Slow-braised beef birria in a red chile broth, served in a crispy cheese-dipped tortilla with consommé', 5.99, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80');
    insertMenuItem.run(taqueroId, 'Tacos', 'Taco de Lengua', 'Tender braised beef tongue with onion, cilantro, and salsa verde on a corn tortilla', 4.99, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80');
    insertMenuItem.run(taqueroId, 'Tacos', 'Taco de Barbacoa', 'Slow-cooked lamb in maguey leaves with avocado salsa and pickled red onion', 5.49, 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400&q=80');
    insertMenuItem.run(taqueroId, 'Tacos', 'Taco de Nopal', 'Grilled cactus paddle with black beans, fresh cheese, and tomato salsa — vegan', 4.49, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80');
    insertMenuItem.run(taqueroId, 'Platillos', 'Enchiladas Verdes', 'Three chicken enchiladas smothered in tomatillo sauce with crema and cotija cheese', 15.99, 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=400&q=80');
    insertMenuItem.run(taqueroId, 'Platillos', 'Mole Negro con Pollo', 'Oaxacan black mole with slow-cooked chicken and sesame-topped rice — a 24-hour preparation', 18.99, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80');
    insertMenuItem.run(taqueroId, 'Postres', 'Flan de Cajeta', 'Silky goat milk caramel flan with a bittersweet caramel pool and cinnamon crema', 6.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');

    // 14. Masala House - Indian
    const masalaHouse = insertRestaurant.run('Masala House', 'Indian', 'Contemporary Indian cuisine celebrating the diverse regional cooking of the subcontinent. From smoky Punjabi tandoor dishes to fragrant Kerala seafood curries, each plate tells a delicious story.', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80', 4.6, 2.99, 25, 45, '1700 Haight St, San Francisco, CA 94117');
    const masalaId = masalaHouse.lastInsertRowid as number;
    insertMenuItem.run(masalaId, 'Starters', 'Aloo Tikki Chaat', 'Crispy potato cakes topped with chickpea curry, tamarind chutney, yogurt, and pomegranate', 9.99, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80');
    insertMenuItem.run(masalaId, 'Starters', 'Seekh Kebab', 'Hand-minced lamb with garam masala and herbs, grilled on skewers with mint chutney', 13.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80');
    insertMenuItem.run(masalaId, 'Starters', 'Dahi Puri', 'Crispy puri shells filled with spiced potatoes, tangy yogurt, and three chutneys', 8.99, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80');
    insertMenuItem.run(masalaId, 'Tandoor', 'Tandoori Jhinga', 'Jumbo prawns marinated in yogurt, ajwain, and chili — charred and smoky from the clay oven', 21.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80');
    insertMenuItem.run(masalaId, 'Tandoor', 'Murgh Malai Tikka', 'Chicken breast marinated in cream cheese, cardamom, and white pepper — meltingly tender', 17.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80');
    insertMenuItem.run(masalaId, 'Curries', 'Kerala Fish Curry', 'Sea bass in a coconut milk and raw mango curry with curry leaves and mustard seeds', 19.99, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80');
    insertMenuItem.run(masalaId, 'Curries', 'Dal Makhani', 'Black lentils slow-cooked overnight with tomato, cream, and fenugreek — rich and velvety', 14.99, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80');
    insertMenuItem.run(masalaId, 'Curries', 'Lamb Nihari', 'Slow-braised lamb shank in a rich bone marrow gravy with garam masala and ginger', 22.99, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80');
    insertMenuItem.run(masalaId, 'Breads & Rice', 'Lamb Biryani', 'Fragrant basmati rice layered with slow-cooked spiced lamb, saffron, and crispy onions', 21.99, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80');
    insertMenuItem.run(masalaId, 'Breads & Rice', 'Garlic Kulcha', 'Leavened flatbread stuffed with roasted garlic and herbs, baked in the tandoor', 4.99, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80');

    // 15. Dragon Palace - Chinese
    const dragonPalace = insertRestaurant.run('Dragon Palace', 'Chinese', 'Authentic Cantonese banquet cooking brought to your table. Our chefs trained in Hong Kong specialty restaurants, bringing traditional dim sum, whole fish, and wok-tossed classics to the Sunset District.', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80', 4.4, 3.99, 30, 50, '2801 Judah St, San Francisco, CA 94122');
    const dragonId = dragonPalace.lastInsertRowid as number;
    insertMenuItem.run(dragonId, 'Dim Sum', 'Char Siu Bao (3 pcs)', 'Steamed BBQ pork buns with pillowy dough and a sweet-savory filling', 7.99, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80');
    insertMenuItem.run(dragonId, 'Dim Sum', 'Cheung Fun (Shrimp)', 'Rice noodle rolls with whole shrimp, served with sweet soy sauce and sesame oil', 9.99, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80');
    insertMenuItem.run(dragonId, 'Dim Sum', 'Egg Tarts (3 pcs)', 'Flaky pastry shells with silky baked egg custard — Hong Kong classic', 6.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');
    insertMenuItem.run(dragonId, 'Soups', 'West Lake Beef Soup', 'Silky egg-drop soup with minced beef, tofu, and water chestnuts in a rich stock', 10.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80');
    insertMenuItem.run(dragonId, 'Soups', 'Buddha Jumps Over the Wall', 'Luxurious slow-cooked broth with sea cucumber, abalone, fish maw, and mushrooms', 34.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80');
    insertMenuItem.run(dragonId, 'Mains', 'Whole Steamed Sea Bass', 'Live sea bass steamed with ginger, scallion, and finished with a pour of sizzling soy oil', 36.99, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80');
    insertMenuItem.run(dragonId, 'Mains', 'Salt & Pepper Crab', 'Fresh Dungeness crab wok-tossed with garlic, chilies, and salt and pepper seasoning', 42.99, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80');
    insertMenuItem.run(dragonId, 'Mains', 'Mapo Tofu', 'Silken tofu in a fiery Sichuan doubanjiang sauce with ground pork and numbing peppercorns', 15.99, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80');
    insertMenuItem.run(dragonId, 'Noodles & Rice', 'Beef Ho Fun', 'Silky wide rice noodles wok-tossed with beef, bean sprouts, and dark soy in a screaming hot wok', 16.99, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80');
    insertMenuItem.run(dragonId, 'Noodles & Rice', 'Yangzhou Fried Rice', 'Classic wok-fried rice with shrimp, char siu, egg, and vegetables — the gold standard', 13.99, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80');

    // 16. Bistro Léon - French
    const bistroLeon = insertRestaurant.run('Bistro Léon', 'French', 'A convivial Lyonnaise bouchon in the heart of Noe Valley. Chef Léon serves hearty Lyonnais classics — quenelles, gratins, and the finest steak frites — alongside a thoughtfully curated wine list.', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', 4.5, 3.99, 35, 55, '4016 24th St, San Francisco, CA 94114');
    const leonId = bistroLeon.lastInsertRowid as number;
    insertMenuItem.run(leonId, 'Starters', 'Salade Lyonnaise', 'Frisée lettuce with lardons, a perfectly poached egg, and Dijon vinaigrette — Lyon\'s most iconic dish', 13.99, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80');
    insertMenuItem.run(leonId, 'Starters', 'Quenelles de Brochet', 'Delicate pike quenelles in a rich Nantua crayfish sauce — the pinnacle of Lyonnais cuisine', 16.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80');
    insertMenuItem.run(leonId, 'Starters', 'Andouillette Grillée', 'Grilled pork tripe sausage with Dijon mustard, shallots, and cornichons — adventurous and delicious', 14.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(leonId, 'Mains', 'Steak Frites', 'Prime bavette steak with shallot and red wine jus, served with crispy hand-cut frites', 28.99, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80');
    insertMenuItem.run(leonId, 'Mains', 'Gratin Dauphinois', 'Wafer-thin potato gratin with crème fraîche, garlic, and a burnished Gruyère crust', 16.99, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80');
    insertMenuItem.run(leonId, 'Mains', 'Poulet Rôti aux Herbes', 'Free-range chicken roasted with tarragon, lemon, and butter — simply perfect', 24.99, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80');
    insertMenuItem.run(leonId, 'Mains', 'Sole Meunière', 'Dover sole pan-fried in brown butter with lemon, capers, and fresh parsley', 32.99, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80');
    insertMenuItem.run(leonId, 'Desserts', 'Tarte Tatin', 'Upside-down caramelized apple tart served warm with crème fraîche', 9.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');
    insertMenuItem.run(leonId, 'Desserts', 'Profiteroles au Chocolat', 'Choux pastry puffs filled with vanilla ice cream and drenched in warm Valrhona chocolate sauce', 10.99, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80');

    // 17. Aegean Table - Mediterranean
    const aegean = insertRestaurant.run('Aegean Table', 'Mediterranean', 'A modern mezze bar celebrating the coastal cuisines of Greece, Turkey, and Lebanon. Share small plates, sip natural wines, and let the flavors of the Aegean transport you to a sun-drenched terrace by the sea.', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80', 4.7, 2.99, 25, 40, '500 Hayes St, San Francisco, CA 94102');
    const aegeanId = aegean.lastInsertRowid as number;
    insertMenuItem.run(aegeanId, 'Cold Mezze', 'Htipiti', 'Whipped roasted red pepper and feta spread with olive oil, walnuts, and pita chips', 9.99, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80');
    insertMenuItem.run(aegeanId, 'Cold Mezze', 'Taramosalata', 'Creamy fish roe dip whipped with bread, lemon, and olive oil — a Greek classic', 8.99, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80');
    insertMenuItem.run(aegeanId, 'Cold Mezze', 'Fattoush', 'Levantine bread salad with tomato, cucumber, radish, pomegranate, and sumac dressing', 10.99, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80');
    insertMenuItem.run(aegeanId, 'Hot Mezze', 'Spanakopita', 'Crispy phyllo triangles filled with spinach, feta, dill, and egg — golden and flaky', 9.99, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80');
    insertMenuItem.run(aegeanId, 'Hot Mezze', 'Keftedes', 'Greek spiced meatballs with mint, cumin, and cinnamon in a light tomato sauce', 12.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(aegeanId, 'Hot Mezze', 'Halloumi Saganaki', 'Pan-fried halloumi cheese flambéed with ouzo and lemon — salty, crispy, and addictive', 11.99, 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80');
    insertMenuItem.run(aegeanId, 'Mains', 'Moussaka', 'Layers of spiced ground lamb, eggplant, and béchamel sauce baked to golden perfection', 22.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(aegeanId, 'Mains', 'Lahmacun', 'Turkish flatbread with spiced minced lamb, peppers, and parsley — roll it up with lemon', 14.99, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80');
    insertMenuItem.run(aegeanId, 'Mains', 'Whole Grilled Octopus', 'Slow-cooked then chargrilled octopus with lemon oil, capers, and fava purée', 34.99, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80');
    insertMenuItem.run(aegeanId, 'Desserts', 'Galaktoboureko', 'Crispy phyllo custard pie soaked in orange blossom syrup — rich and aromatic', 8.99, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80');

    // 18. Hangang BBQ - Korean
    const hangang = insertRestaurant.run('Hangang BBQ', 'Korean', 'Premium Korean barbecue with high-grade meats, house-made marinades, and a full array of banchan. Our charcoal grills and expert table service deliver the ultimate Korean dining experience at home.', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80', 4.8, 3.49, 30, 50, '4001 Geary Blvd, San Francisco, CA 94118');
    const hangangId = hangang.lastInsertRowid as number;
    insertMenuItem.run(hangangId, 'Starters', 'Sundubu Jjigae', 'Silky soft tofu stew with clams, pork, and egg in a fiery gochugaru broth', 13.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80');
    insertMenuItem.run(hangangId, 'Starters', 'Pajeon', 'Crispy green onion and seafood pancake with a soy dipping sauce — perfect with makgeolli', 12.99, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80');
    insertMenuItem.run(hangangId, 'Starters', 'Banchan Platter', 'Eight rotating house-made side dishes including kimchi, spinach namul, and japchae', 14.99, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80');
    insertMenuItem.run(hangangId, 'BBQ Sets', 'Hangang Premium Set (2 ppl)', 'USDA Prime galbi, bulgogi, pork belly, and marinated chicken with all banchan and rice', 64.99, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80');
    insertMenuItem.run(hangangId, 'BBQ Sets', 'Wagyu Short Rib', 'A5 Wagyu galbi cut Korean-style — marbled, rich, and extraordinary', 42.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(hangangId, 'BBQ Sets', 'Spicy Pork Bulgogi', 'Thinly sliced pork neck marinated in a fiery gochujang and sesame sauce', 22.99, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80');
    insertMenuItem.run(hangangId, 'Stews & Noodles', 'Doenjang Jjigae', 'Robust fermented soybean paste stew with tofu, zucchini, and mushrooms', 14.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80');
    insertMenuItem.run(hangangId, 'Stews & Noodles', 'Mul Naengmyeon', 'Chilled buckwheat noodles in an icy beef broth with beef slices, egg, and cucumber', 15.99, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80');
    insertMenuItem.run(hangangId, 'Desserts', 'Bingsu (Mango)', 'Shaved milk ice with fresh mango, mochi, condensed milk, and sweet red bean', 12.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');

    // 19. Siam Street - Thai
    const siamStreet = insertRestaurant.run('Siam Street', 'Thai', 'Regional Thai cooking that goes far beyond the usual. From the coconut-rich curries of the South to the herbaceous, fiery dishes of Isaan, Siam Street takes you on a journey through Thailand\'s incredible culinary geography.', 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80', 4.6, 2.49, 20, 35, '4652 Mission St, San Francisco, CA 94112');
    const siamId = siamStreet.lastInsertRowid as number;
    insertMenuItem.run(siamId, 'Appetizers', 'Miang Kham', 'Traditional wild betel leaf wraps with toasted coconut, ginger, lime, peanuts, and dried shrimp', 10.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80');
    insertMenuItem.run(siamId, 'Appetizers', 'Sai Oua', 'Northern Thai herbal pork sausage with lemongrass, galangal, and kaffir lime leaves', 12.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(siamId, 'Appetizers', 'Tod Mun Pla', 'Thai fish cakes with kaffir lime and green beans, served with cucumber relish', 11.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80');
    insertMenuItem.run(siamId, 'Soups & Salads', 'Tom Kha Gai', 'Coconut milk soup with chicken, galangal, lemongrass, and mushrooms — fragrant and soothing', 13.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80');
    insertMenuItem.run(siamId, 'Soups & Salads', 'Som Tum Isaan', 'Green papaya salad with fermented crab, fish sauce, palm sugar, and plenty of bird\'s eye chili — fiery', 11.99, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80');
    insertMenuItem.run(siamId, 'Mains', 'Gaeng Tai Pla', 'Southern Thai fermented fish kidney curry with bamboo shoots, eggplant, and long beans — bold and funky', 19.99, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80');
    insertMenuItem.run(siamId, 'Mains', 'Khao Soi', 'Northern Thai coconut curry noodle soup with braised chicken, crispy noodles, and pickled mustard', 17.99, 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&q=80');
    insertMenuItem.run(siamId, 'Mains', 'Phat Kraphao Moo Saap', 'Stir-fried pork with holy basil, garlic, and chili — Thailand\'s most beloved street food dish', 15.99, 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&q=80');
    insertMenuItem.run(siamId, 'Desserts', 'Bua Loi', 'Chewy rice flour balls in warm coconut milk with pandan and sesame — comforting Thai classic', 6.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');
    insertMenuItem.run(siamId, 'Desserts', 'Khanom Krok', 'Crispy-edged coconut rice pancakes with a custardy center — made fresh to order', 7.99, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80');

    // 20. Pit Stop BBQ - American
    const pitStop = insertRestaurant.run('Pit Stop BBQ', 'American', 'Low and slow is the only way we know. Our pitmasters smoke meats over California oak for 12–18 hours, producing ribs, brisket, and pulled pork with bark so good you\'ll want to eat it by itself.', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80', 4.7, 2.99, 25, 45, '1200 Tennessee St, San Francisco, CA 94107');
    const pitId = pitStop.lastInsertRowid as number;
    insertMenuItem.run(pitId, 'Starters', 'Burnt End Bites', 'Caramelized brisket point burnt ends tossed in house BBQ sauce — candy-like and irresistible', 13.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(pitId, 'Starters', 'Smoked Wings (8 pcs)', 'Low-and-slow smoked chicken wings finished on the grill with Alabama white sauce', 14.99, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80');
    insertMenuItem.run(pitId, 'Starters', 'Pimento Cheese Dip', 'Sharp cheddar and cream cheese blended with roasted jalapeños, served with smoked crackers', 9.99, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80');
    insertMenuItem.run(pitId, 'BBQ Plates', 'Brisket Plate', '12-hour oak-smoked USDA Prime brisket sliced to order, with two sides and pickles', 26.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(pitId, 'BBQ Plates', 'St. Louis Ribs (Full Rack)', 'Missouri-cut pork spare ribs with dry rub, smoked 6 hours over white oak', 34.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(pitId, 'BBQ Plates', 'Pulled Pork Sandwich', 'Slow-smoked pork shoulder pulled and piled high on a brioche bun with vinegar slaw', 14.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80');
    insertMenuItem.run(pitId, 'BBQ Plates', 'Pitmaster\'s Platter (2 ppl)', 'Brisket, ribs, pulled pork, a half chicken, four sides, and cornbread — the full spread', 58.99, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80');
    insertMenuItem.run(pitId, 'Sides', 'Smoked Mac & Cheese', 'Elbow pasta in a smoked Gouda and sharp cheddar sauce with a toasted breadcrumb crust', 7.99, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80');
    insertMenuItem.run(pitId, 'Sides', 'Jalapeño Cornbread', 'Cast-iron skillet cornbread with roasted jalapeños, honey butter on the side', 5.99, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80');
    insertMenuItem.run(pitId, 'Desserts', 'Banana Pudding', 'Layers of vanilla wafers, fresh banana, and house-made custard topped with toasted meringue', 7.99, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80');
    insertMenuItem.run(pitId, 'Desserts', 'Peach Cobbler', 'Warm spiced peach filling under a buttery biscuit crust, served with vanilla ice cream', 7.99, 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=400&q=80');
  });

  seedAll();
}

export function seedAdditionalReviews(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment, reviewer_name, created_at)
    VALUES (NULL, ?, NULL, ?, ?, ?, datetime('now', ? || ' days'))
  `);

  const data: Array<{ restaurantId: number; reviews: Array<{ rating: number; comment: string; name: string; daysAgo: number }> }> = [
    // 11. Trattoria Roma
    // 11. Trattoria Roma
    { restaurantId: 11, reviews: [
      { rating: 5, comment: "Cacio e pepe was executed with real Roman precision — just the right pepper and the sauce was perfectly emulsified. Better than Rome.", name: "Marco F.", daysAgo: 3 },
      { rating: 5, comment: "Supplì were crispy outside, molten inside with ragù and mozzarella. Extraordinary — better than what I had in Trastevere.", name: "Rachel S.", daysAgo: 7 },
      { rating: 5, comment: "Bucatini all'Amatriciana was deeply flavorful with proper guanciale. Perfectly al dente. This is the real deal.", name: "Giulia R.", daysAgo: 12 },
      { rating: 4, comment: "Really excellent pasta. The bucatini was al dente and the guanciale was top quality. Only wish portions were a bit bigger.", name: "Nina B.", daysAgo: 18 },
      { rating: 4, comment: "Semifreddo al torroncino was an elegant and unusual dessert — the nougat flavor was distinctive and wonderful.", name: "Patrick O.", daysAgo: 25 },
      { rating: 3, comment: "Risotto ai funghi arrived a bit gluey from delivery. Flavors were good though. Would try pickup next time.", name: "Sophia K.", daysAgo: 33 },
      { rating: 2, comment: "The gnocchi alla Romana were dense and heavy. Expected more finesse for the price. Disappointed.", name: "George T.", daysAgo: 43 },
      { rating: 1, comment: "Order arrived an hour late, food was cold, and wrong pasta was sent. Refund process was a nightmare.", name: "Elena V.", daysAgo: 55 },
    ]},
    // 12. Ramen Kazu
    { restaurantId: 12, reviews: [
      { rating: 5, comment: "The tonkotsu broth is milky, rich, and has clearly been simmered for hours. Best ramen I've had delivered anywhere in the city.", name: "Kevin T.", daysAgo: 2 },
      { rating: 5, comment: "Spicy miso ramen hit every note — the depth of the miso, the heat of the chili oil, the perfectly soft egg. Absolutely incredible.", name: "Yuki H.", daysAgo: 5 },
      { rating: 5, comment: "Shoyu ramen had a beautifully clear broth with brilliant clarity of flavor. The yuzu notes made it sing. Exceptional.", name: "Lauren M.", daysAgo: 9 },
      { rating: 5, comment: "Salmon ikura don was spectacular — sashimi-grade salmon over perfectly seasoned rice with beautiful roe. A stunning bowl.", name: "Priya K.", daysAgo: 14 },
      { rating: 4, comment: "Karaage chicken was super crispy and juicy. The dipping sauce was excellent. Great starter before the ramen.", name: "Sam W.", daysAgo: 19 },
      { rating: 4, comment: "Chashu don was a beautiful bowl — glossy pork belly over perfectly seasoned rice with a jammy egg. Very satisfying.", name: "Michelle L.", daysAgo: 25 },
      { rating: 4, comment: "Gyoza had a lovely crispy skirt and the filling was juicy. Yuzu ponzu was a nice twist on the classic. Really good.", name: "Henry K.", daysAgo: 31 },
      { rating: 3, comment: "Ramen was good but noodles had softened a bit in delivery. Still enjoyable though. Would try pickup for the full experience.", name: "Sophie Z.", daysAgo: 38 },
      { rating: 3, comment: "Average tonkotsu — nothing wrong with it but didn't blow me away. Decent for delivery on a Tuesday night.", name: "Jason W.", daysAgo: 46 },
      { rating: 2, comment: "Vegan shio ramen was very thin and lacking depth. Expected more complexity from a specialist ramen restaurant. Bland.", name: "Emma T.", daysAgo: 56 },
      { rating: 1, comment: "Received completely wrong order. When I called, was put on hold for 20 minutes. Eventually gave up. Very disappointing.", name: "Robert N.", daysAgo: 68 },
    ]},
    // 13. El Taquero
    { restaurantId: 13, reviews: [
      { rating: 5, comment: "Birria tacos were a revelation — the consommé arrived separately and the cheese-dipped tortilla had a perfect crisp. Incredible.", name: "Carlos V.", daysAgo: 4 },
      { rating: 5, comment: "Taco de lengua was the most tender, flavorful beef tongue I've ever had. The salsa verde was vibrant and bright. Stunning.", name: "Isabel C.", daysAgo: 9 },
      { rating: 5, comment: "Tostadas de tinga were incredible — crispy base, shredded chicken with brilliant chipotle flavor, and cool crema. Loved it.", name: "Maria G.", daysAgo: 15 },
      { rating: 4, comment: "Enchiladas verdes were properly sauced and the chicken filling was moist. Great tomatillo sauce. Really good.", name: "Roberto M.", daysAgo: 22 },
      { rating: 4, comment: "Queso fundido arrived still bubbling with Oaxacan cheese. The fresh tortillas were soft and delicious. Great starter.", name: "Jake F.", daysAgo: 30 },
      { rating: 3, comment: "Tacos were good but smaller than I expected for the price. The barbacoa was flavorful though. Average value overall.", name: "Alicia H.", daysAgo: 39 },
      { rating: 2, comment: "Mole negro was very watery and lacked the complexity you'd expect from a proper mole. Really disappointing.", name: "Malee C.", daysAgo: 50 },
      { rating: 1, comment: "Food was cold, tortillas were stiff, and an item was missing. Couldn't get through to anyone. Wouldn't order again.", name: "Dana L.", daysAgo: 63 },
    ]},
    // 14. Masala House
    { restaurantId: 14, reviews: [
      { rating: 5, comment: "Lamb nihari was extraordinary — the bone marrow richness in the gravy was unlike anything I've had. Deeply complex and warming.", name: "Priya S.", daysAgo: 3 },
      { rating: 5, comment: "Aloo tikki chaat was an explosion of textures and flavors — crunchy, creamy, tangy, and sweet all at once. Phenomenal.", name: "Aisha K.", daysAgo: 8 },
      { rating: 5, comment: "Murgh malai tikka was incredibly tender and the cream cheese marinade created something very special. Melted in my mouth.", name: "Dev R.", daysAgo: 14 },
      { rating: 4, comment: "Lamb biryani with fragrant saffron rice was beautifully layered and the meat was perfectly spiced. Really impressive.", name: "Sunita P.", daysAgo: 21 },
      { rating: 4, comment: "Kerala fish curry was bold and authentic. The coconut milk and raw mango balance was brilliant. Excellent with the kulcha.", name: "Tom B.", daysAgo: 29 },
      { rating: 3, comment: "Dal makhani was good but not exceptional — I've had better. The garlic kulcha was the highlight of the order.", name: "Anita P.", daysAgo: 38 },
      { rating: 2, comment: "Everything arrived cold and the curry had separated. The flavors underneath were probably good but the experience was poor.", name: "Raj K.", daysAgo: 49 },
      { rating: 1, comment: "Ordered spicy, got something completely bland. Seekh kebab was dry and flavorless. Very disappointing for the price.", name: "Claire F.", daysAgo: 62 },
    ]},
    // 15. Dragon Palace
    { restaurantId: 15, reviews: [
      { rating: 5, comment: "The whole steamed sea bass with sizzling soy oil was an absolute showstopper. The freshness of the fish was impeccable.", name: "Linda C.", daysAgo: 4 },
      { rating: 5, comment: "Buddha jumps over the wall is extraordinary — an incredibly luxurious broth with sea cucumber and abalone. Worth every penny.", name: "Henry K.", daysAgo: 9 },
      { rating: 5, comment: "Char siu bao were pillowy and the BBQ pork filling was sweet and perfectly seasoned. Better than most dim sum restaurants.", name: "Michelle L.", daysAgo: 15 },
      { rating: 4, comment: "Beef ho fun had genuine wok hei — the smoky, charred flavor came through even in delivery. Very impressive technique.", name: "Jason W.", daysAgo: 22 },
      { rating: 4, comment: "Egg tarts were silky and perfectly baked with a flaky pastry. The quintessential Hong Kong classic done well.", name: "Sophie Z.", daysAgo: 29 },
      { rating: 4, comment: "Yangzhou fried rice was light and well-seasoned with every grain separate. The char siu pieces were plentiful.", name: "Kevin T.", daysAgo: 37 },
      { rating: 3, comment: "Dim sum was decent but a few items arrived cool. The siu mai and char siu bao were the best of the lot.", name: "Lauren M.", daysAgo: 46 },
      { rating: 3, comment: "West Lake beef soup was thin for my taste. Flavors were subtle — perhaps too subtle. Not bad, just very gentle.", name: "Yuki H.", daysAgo: 56 },
      { rating: 2, comment: "Salt and pepper crab was overcooked and rubbery. For the price, I expected much better quality. Disappointing.", name: "Sam W.", daysAgo: 67 },
      { rating: 1, comment: "Ordered dim sum, received completely wrong items. Customer service was unhelpful and dismissive. Will not order again.", name: "Priya K.", daysAgo: 80 },
    ]},
    // 16. Bistro Léon
    { restaurantId: 16, reviews: [
      { rating: 5, comment: "Salade Lyonnaise was textbook perfect — the poached egg broke over the warm lardons and the frisée. A bistro classic done beautifully.", name: "Amélie D.", daysAgo: 3 },
      { rating: 5, comment: "Steak frites arrived with the bavette cooked to a perfect medium-rare. The shallot jus was extraordinary. Bravo.", name: "Pierre M.", daysAgo: 8 },
      { rating: 5, comment: "Profiteroles drenched in Valrhona chocolate sauce were indulgent and perfect. The choux was light as air.", name: "Isabelle R.", daysAgo: 14 },
      { rating: 4, comment: "Poulet rôti was juicy with crispy golden skin and the tarragon butter was fragrant and wonderful. Excellent.", name: "Charlotte B.", daysAgo: 21 },
      { rating: 3, comment: "Gratin dauphinois was tasty but arrived very heavy and rich — perhaps too much cream. Decent though.", name: "William F.", daysAgo: 30 },
      { rating: 2, comment: "Tarte Tatin pastry was completely soggy. The apple filling was good but the texture was completely ruined in transit.", name: "Camille R.", daysAgo: 42 },
      { rating: 1, comment: "Quenelles arrived looking nothing like expected and tasted reheated. Very expensive for what was delivered. Extremely disappointed.", name: "Étienne L.", daysAgo: 57 },
    ]},
    // 17. Aegean Table
    { restaurantId: 17, reviews: [
      { rating: 5, comment: "Htipiti is the most addictive spread I've ever eaten. Whipped feta with roasted peppers and walnuts — I could eat it by the jar.", name: "Sophia K.", daysAgo: 3 },
      { rating: 5, comment: "Whole grilled octopus was tender, charred, and served with a beautiful fava purée. Restaurant-quality in every way.", name: "Elena V.", daysAgo: 7 },
      { rating: 5, comment: "Cold mezze spread was stunning — every dip arrived fresh and vibrant. The fattoush and htipiti were exceptional.", name: "Yasmin A.", daysAgo: 12 },
      { rating: 4, comment: "Moussaka was hearty and beautifully layered. The béchamel was creamy and the lamb was well-seasoned. Very good.", name: "Nicholas P.", daysAgo: 18 },
      { rating: 4, comment: "Halloumi saganaki was perfectly crispy and the ouzo flame gave it a subtle anise note. Delicious and unusual.", name: "George T.", daysAgo: 25 },
      { rating: 4, comment: "Lahmacun arrived thin and crispy with vibrant spiced lamb. Rolling it with lemon and herbs was exactly right.", name: "Hassan R.", daysAgo: 33 },
      { rating: 3, comment: "Keftedes were a bit dry. The fattoush salad was fresh and vibrant though. Mixed experience overall.", name: "Anita P.", daysAgo: 42 },
      { rating: 2, comment: "Spanakopita were completely soggy — classic phyllo problem with delivery. The filling was tasty but texturally ruined.", name: "Raj K.", daysAgo: 53 },
      { rating: 1, comment: "Order was half missing and when I tried to report it the restaurant never responded. Charged full price for partial order.", name: "Claire F.", daysAgo: 67 },
    ]},
    // 18. Hangang BBQ
    { restaurantId: 18, reviews: [
      { rating: 5, comment: "Wagyu short ribs were on another level — the marbling was insane and the marinade enhanced rather than overwhelmed the beef.", name: "Jisoo P.", daysAgo: 2 },
      { rating: 5, comment: "Hangang Premium Set was worth every penny. The quality of meat and the eight banchan dishes made it a true feast.", name: "Min K.", daysAgo: 5 },
      { rating: 5, comment: "Mul naengmyeon arrived in a chilled container — cold buckwheat noodles in icy broth were perfect. They know how to pack food.", name: "Rachel S.", daysAgo: 9 },
      { rating: 5, comment: "Banchan platter alone was worth ordering — all eight dishes were beautifully made, especially the kimchi and japchae.", name: "Dana L.", daysAgo: 13 },
      { rating: 5, comment: "This is the most authentic Korean BBQ experience I've had delivered anywhere. The meat quality is genuinely exceptional.", name: "Chris O.", daysAgo: 18 },
      { rating: 4, comment: "Spicy pork bulgogi was fiery and well-marinated. The gochujang flavor came through beautifully. Excellent dish.", name: "Minji K.", daysAgo: 23 },
      { rating: 4, comment: "Sundubu jjigae arrived bubbling in a special container. Silky tofu and clams in that spicy broth — comforting perfection.", name: "Daniel Y.", daysAgo: 29 },
      { rating: 4, comment: "Pajeon was crispy and loaded with scallion and seafood. The dipping sauce was perfectly balanced. Great starter.", name: "Jisoo L.", daysAgo: 35 },
      { rating: 4, comment: "Doenjang jjigae was earthy, warming, and deeply savory. Arrived properly hot and the tofu was tender.", name: "Kevin T.", daysAgo: 42 },
      { rating: 3, comment: "Bingsu was good but had melted a bit in transit. Still tasty — the mango was ripe and the mochi was chewy.", name: "Lauren M.", daysAgo: 50 },
      { rating: 3, comment: "BBQ is always better grilled yourself so delivery loses something. The banchan and stews are the way to go here.", name: "Yuki H.", daysAgo: 59 },
      { rating: 2, comment: "Delivery took 90 minutes. Food was lukewarm at best. Not what you want for Korean BBQ. Very frustrating.", name: "Sam W.", daysAgo: 70 },
      { rating: 1, comment: "Order was wrong and arrived an hour late. Missing key banchan items. Very disappointing for the price point.", name: "Priya K.", daysAgo: 84 },
    ]},
    // 19. Siam Street
    { restaurantId: 19, reviews: [
      { rating: 5, comment: "Khao soi is simply the best thing I've eaten all year. The coconut curry broth, crispy noodles, and braised chicken — absolute perfection.", name: "Malee C.", daysAgo: 3 },
      { rating: 5, comment: "Phat kraphao with a fried egg is the most authentic Thai street food I've had outside Bangkok. Holy basil was fresh and fragrant.", name: "Robert N.", daysAgo: 8 },
      { rating: 5, comment: "Sai Oua northern sausage was fragrant, herbaceous, and unlike any sausage I've had. The lemongrass and galangal were incredible.", name: "Alicia H.", daysAgo: 14 },
      { rating: 4, comment: "Som tum Isaan was aggressively spicy and funky from the fermented crab — exactly as it should be. Wonderful.", name: "Jason W.", daysAgo: 21 },
      { rating: 4, comment: "Tod mun pla were crispy and had great bounce. The cucumber relish was the perfect cool contrast. Really good.", name: "Emma T.", daysAgo: 29 },
      { rating: 3, comment: "Gaeng tai pla is very intense and not for everyone — I found it a bit too fermented for my taste. Authentic though.", name: "Sophia K.", daysAgo: 38 },
      { rating: 2, comment: "Tom kha gai was thin and lacked the coconut richness I expected. Quite a disappointment for a signature Thai soup.", name: "Nicholas P.", daysAgo: 50 },
    ]},
    // 20. Pit Stop BBQ
    { restaurantId: 20, reviews: [
      { rating: 5, comment: "This brisket has the bark and smoke ring of a Texas legend. I cannot believe this came from a delivery box. Absolutely extraordinary.", name: "Tyler B.", daysAgo: 2 },
      { rating: 5, comment: "Burnt end bites are pure magic — caramelized, smoky, sticky, and falling apart. I've eaten at award-winning joints and these stand up.", name: "Ashley M.", daysAgo: 5 },
      { rating: 5, comment: "St. Louis ribs had the perfect bend test — they flexed without falling apart. Twelve hours of smoke is evident in every bite.", name: "Brandon K.", daysAgo: 9 },
      { rating: 5, comment: "Banana pudding arrived with the toasted meringue still intact. The custard was made from scratch. A stunning dessert.", name: "Megan T.", daysAgo: 13 },
      { rating: 4, comment: "Pulled pork sandwich was generously loaded with proper vinegar slaw cutting through the richness. One of the best sandwiches I've had.", name: "Kayla R.", daysAgo: 18 },
      { rating: 4, comment: "Smoked mac and cheese with Gouda was outrageously good. The toasted breadcrumb crust added perfect texture.", name: "Josh L.", daysAgo: 23 },
      { rating: 4, comment: "Pitmaster's platter for two was incredible value — brisket, ribs, pulled pork, chicken, four sides. A true BBQ feast.", name: "Brianna T.", daysAgo: 29 },
      { rating: 4, comment: "Smoked wings with Alabama white sauce were a revelation. The mayo-based sauce sounds odd but it's brilliant on smoked chicken.", name: "Derek L.", daysAgo: 36 },
      { rating: 4, comment: "Jalapeño cornbread fresh from a cast iron skillet with honey butter — one of the best sides I've ever had delivered.", name: "Natalie G.", daysAgo: 44 },
      { rating: 3, comment: "Good BBQ — brisket was decent but the flat was a bit dry on my order. The point was perfect though. Sides were excellent.", name: "Carlos M.", daysAgo: 53 },
      { rating: 3, comment: "Ribs were good but not quite fall-off-the-bone. The rub was excellent though. Solid BBQ overall.", name: "Jessica R.", daysAgo: 63 },
      { rating: 2, comment: "Brisket arrived cold and had dried out significantly. BBQ really needs to be eaten fresh off the smoker. Poor delivery experience.", name: "Marco V.", daysAgo: 75 },
      { rating: 1, comment: "Ordered a full rack of ribs and received half a rack. When I contacted them I got no response. Complete rip-off.", name: "Omar A.", daysAgo: 90 },
    ]},
  ];

  const seedAll = db.transaction(() => {
    for (const restaurant of data) {
      for (const review of restaurant.reviews) {
        insert.run(
          restaurant.restaurantId,
          review.rating,
          review.comment,
          review.name,
          `-${review.daysAgo}`
        );
      }
    }
  });

  seedAll();
}
