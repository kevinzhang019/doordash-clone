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
      '123 Little Italy Ave, New York, NY 10013'
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
      '456 Cherry Blossom Lane, San Francisco, CA 94107'
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
      '789 Fiesta Street, Los Angeles, CA 90021'
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
      '321 Curry Lane, Chicago, IL 60601'
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
      '888 Dragon Street, San Francisco, CA 94108'
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
      '15 Rue de la Paix, New York, NY 10020'
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
      '567 Aegean Boulevard, Miami, FL 33101'
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
      '234 Gangnam-gu Road, Los Angeles, CA 90010'
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
      '678 Sukhumvit Court, Houston, TX 77002'
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
      '100 Main Street, Austin, TX 78701'
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
