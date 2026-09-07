create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text not null, category text not null,
  materials text[] not null, size_options text[] not null, price numeric not null,
  image_url text, seller_name text not null, seller_location text not null,
  seller_phone text not null, status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) not null,
  buyer_name text not null, buyer_address text not null, buyer_phone text not null,
  selected_size text not null, quantity int not null default 1,
  order_status text not null default 'new', created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, message text not null,
  created_at timestamptz not null default now()
);

grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
grant insert on public.orders to anon, authenticated;
grant all on public.orders to service_role;
grant insert on public.messages to anon, authenticated;
grant all on public.messages to service_role;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;

create policy "Published products are viewable by everyone"
  on public.products for select to anon, authenticated using (status = 'published');
create policy "Anyone can place an order"
  on public.orders for insert to anon, authenticated with check (true);
create policy "Anyone can send a message"
  on public.messages for insert to anon, authenticated with check (true);

insert into public.products (title, description, category, materials, size_options, price, image_url, seller_name, seller_location, seller_phone, status) values
('Terracotta Water Pitcher','Thrown on a foot-powered wheel and left to breathe in the shade before a slow pit firing. The unglazed clay keeps water naturally cool through the hottest afternoons. Each pitcher carries the faint ridges of the potter''s fingertips.','Pottery & Ceramics','{"River clay","Natural slip"}','{"Small (1L)","Medium (2L)","Large (3L)"}',850,'https://source.unsplash.com/400x400/?terracotta-pottery','Ramesh Prajapati','Khurja, Uttar Pradesh','+91 98110 22001','published'),
('Blue Pottery Bud Vase','Painted freehand with cobalt oxide over a quartz-and-gum body, a craft that came to Jaipur along the old Persian trade routes. It is fired only once, at low heat, which gives the glaze its glassy shimmer. No two brushstroke vines ever repeat.','Pottery & Ceramics','{"Quartz powder","Cobalt oxide glaze"}','{"6 inch","9 inch"}',1250,'https://source.unsplash.com/400x400/?blue-pottery-vase','Farida Khan','Jaipur, Rajasthan','+91 98290 33112','published'),
('Black Clay Serving Bowl','Smoke-fired in a sealed pit so the clay drinks in carbon and turns a deep charcoal black. The surface is burnished with a smooth river stone until it shines without any glaze. It warms beautifully with everyday use.','Pottery & Ceramics','{"Black clay","Rice husk"}','{"Medium","Large"}',690,'https://source.unsplash.com/400x400/?black-clay-bowl','Sunita Devi','Manipur, Imphal','+91 98620 44523','published'),
('Banarasi Silk Dupatta','Woven on a pit-loom over eleven days, with real zari lifted thread by thread through the jala technique. The mango-buti motifs are drawn from old family pattern cards. It falls with the weight only handloom silk has.','Handloom Textiles','{"Mulberry silk","Zari thread"}','{"2.5 m","3 m"}',3200,'https://source.unsplash.com/400x400/?banarasi-silk-weaving','Mohammad Ansari','Varanasi, Uttar Pradesh','+91 94150 55234','published'),
('Pochampally Ikat Stole','The yarn is tie-dyed before it ever meets the loom, so the pattern blooms slowly as the weaving grows. Those soft feathered edges are the honest signature of true double-ikat. Dyed with indigo and madder root.','Handloom Textiles','{"Cotton yarn","Natural indigo"}','{"Regular","Long"}',1450,'https://source.unsplash.com/400x400/?ikat-handloom-textile','Lakshmi Narayana','Pochampally, Telangana','+91 90000 66145','published'),
('Kutch Bandhani Cotton Scarf','Thousands of tiny points are tied off by fingernail before the cloth goes into the dye vat. When it is untied, the dots open like scattered seeds across the fabric. The knots are still faintly visible near the border.','Handloom Textiles','{"Handspun cotton","Vegetable dye"}','{"Small","Medium","Large"}',780,'https://source.unsplash.com/400x400/?bandhani-scarf','Jethabhai Vankar','Bhuj, Gujarat','+91 99250 77316','published'),
('Woven Bamboo Storage Basket','Split cane is soaked overnight, then coiled and locked without a single nail. The weaver works from the base outward, tightening each round by hand. Light enough to carry, strong enough for a season of grain.','Bamboo & Cane Craft','{"Split bamboo","Cane binding"}','{"Small","Medium","Large"}',560,'https://source.unsplash.com/400x400/?bamboo-basket','Bipul Nath','Barpeta, Assam','+91 94350 88427','published'),
('Cane Pendant Lampshade','Steamed cane is bent over a wooden former while still warm, then held until it sets its curve. The open weave throws soft ribbons of light across the ceiling. Finished with a light bee''s-wax rub.','Bamboo & Cane Craft','{"Cane","Beeswax finish"}','{"12 inch","16 inch"}',1650,'https://source.unsplash.com/400x400/?cane-lampshade','Debashish Roy','Agartala, Tripura','+91 94020 99538','published'),
('Bamboo Tea Coaster Set','Cut from a single culm and hand-planed so the natural node lines run across the face. Each coaster is sanded through four grades before oiling. A set of six, no two grain patterns alike.','Bamboo & Cane Craft','{"Solid bamboo","Linseed oil"}','{"Set of 4","Set of 6"}',350,'https://source.unsplash.com/400x400/?bamboo-coaster','Karma Bhutia','Kalimpong, West Bengal','+91 89720 11649','published'),
('Dhokra Tribal Pendant','Made by lost-wax casting: a wax thread is coiled over a clay core, wrapped in mud, then burned out and replaced with molten brass. The mould is broken to free a piece that can never be repeated. The wax coils stay visible forever.','Jewelry','{"Bell metal brass","Beeswax"}','{"18 inch chain","22 inch chain"}',1150,'https://source.unsplash.com/400x400/?dhokra-brass-jewelry','Sukhram Ghadwa','Bastar, Chhattisgarh','+91 94240 22750','published'),
('Tribal Silver Hasli Necklace','Hammered from a single silver rod and slowly bent into a rigid neck ring on a wooden stake. The tribal punchwork along the front is struck with hand-cut steel dies. It sits close to the collarbone, the way it has for generations.','Jewelry','{"92.5 sterling silver"}','{"Standard","Wide"}',2850,'https://source.unsplash.com/400x400/?silver-tribal-jewelry','Meena Rathore','Udaipur, Rajasthan','+91 96490 33861','published'),
('Lac Bangle Pair','Melted lac is rolled hot around a wooden rod, then studded with mirror glass before it cools. The maker works fast; lac hardens in under a minute. Warm to the touch and light on the wrist.','Jewelry','{"Natural lac","Mirror glass"}','{"2.4 inch","2.6 inch","2.8 inch"}',450,'https://source.unsplash.com/400x400/?lac-bangles','Ismail Manihar','Hyderabad, Telangana','+91 90100 44972','published'),
('Brass Diya Oil Lamp','Sand-cast in Moradabad workshops, then turned on a lathe to bring out the bright metal. The rim is hand-filed so the wick sits steady and burns clean. It picks up a soft patina over the years.','Home Decor','{"Cast brass"}','{"Small","Medium","Set of 3"}',620,'https://source.unsplash.com/400x400/?brass-diya-lamp','Asif Siddiqui','Moradabad, Uttar Pradesh','+91 98370 55083','published'),
('Madhubani Painted Wall Panel','Painted with hand-cut bamboo nibs and pigments ground from turmeric, soot and marigold. The double outline and the fish motifs come straight from Mithila wedding walls. Every gap is filled, as tradition demands.','Home Decor','{"Handmade paper","Natural pigment"}','{"A3","A2"}',1850,'https://source.unsplash.com/400x400/?madhubani-painting','Rekha Jha','Madhubani, Bihar','+91 94310 66194','published'),
('Warli Painted Clay Pot','A cow-dung and clay wash goes down first, then the white rice-paste figures are drawn on with a chewed bamboo twig. The dancing circle tells a harvest story. It is meant to be seen, not filled.','Home Decor','{"Terracotta","Rice paste"}','{"8 inch","12 inch"}',980,'https://source.unsplash.com/400x400/?warli-art-pot','Jivya Mashe','Dahanu, Maharashtra','+91 98920 77205','published'),
('Kashmiri Walnut Wood Tray','Carved from seasoned walnut with the chinar-leaf pattern that Srinagar carvers learn first and perfect last. The chisel work is done entirely by hand, never routed. The grain darkens richly with age.','Home Decor','{"Walnut wood","Natural wax"}','{"Medium","Large"}',2400,'https://source.unsplash.com/400x400/?walnut-wood-carving','Bashir Ahmad Wani','Srinagar, Kashmir','+91 90860 88316','published'),
('Channapatna Wooden Elephant','Turned on a hand lathe from soft ivory-wood, then coloured with vegetable dyes and polished with a dried screwpine leaf. Completely safe if a child decides to chew it. The lacquer glow comes from friction alone, no varnish.','Wooden Toys','{"Ivory wood","Vegetable lacquer"}','{"Small","Medium","Large"}',540,'https://source.unsplash.com/400x400/?wooden-toy-elephant','Shivanna Gowda','Channapatna, Karnataka','+91 98450 99427','published'),
('Etikoppaka Spinning Top','Shaped from ankudu wood on a foot-driven lathe and dyed with lacquer made from seeds, roots and bark. The colours are food-safe and have been used here for three hundred years. It spins for a surprisingly long time.','Wooden Toys','{"Ankudu wood","Seed lacquer"}','{"Small","Regular"}',280,'https://source.unsplash.com/400x400/?spinning-top-wooden','Padmanabham Raju','Etikoppaka, Andhra Pradesh','+91 94400 11538','published'),
('Kondapalli Bullock Cart Toy','Carved from lightweight tella poniki wood and joined with tamarind-seed paste instead of glue. The wheels really turn, and the oxen are painted with enamel by the carver''s wife. A toy that survives being played with.','Wooden Toys','{"Poniki wood","Tamarind paste"}','{"Small","Medium"}',760,'https://source.unsplash.com/400x400/?wooden-bullock-cart-toy','Venkanna Nakash','Kondapalli, Andhra Pradesh','+91 91770 22649','published'),
('Sawantwadi Wooden Fruit Set','Each fruit is turned solid on a lathe, then painted in layers with natural pigment until the skin looks almost real. The mango and chikoo are the hardest to get right. Sold as a small basketful.','Wooden Toys','{"Mango wood","Natural pigment"}','{"Set of 5","Set of 8"}',1150,'https://source.unsplash.com/400x400/?wooden-fruit-toys','Rajan Chitari','Sawantwadi, Maharashtra','+91 94220 33751','published');