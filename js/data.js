// Word lists. These are small samples: a real attacker's lists hold hundreds of millions of entries.
// Order matters for COMMON: position is the guess rank (1 = tried first).

export const COMMON = (`123456 password 12345678 qwerty 123456789 12345 1234 111111 1234567 dragon 123123 baseball abc123 football
monkey letmein 696969 shadow master 666666 qwertyuiop 123321 mustang 1234567890 michael 654321 superman 1qaz2wsx 7777777 121212
000000 qazwsx 123qwe killer trustno1 jordan jennifer zxcvbnm asdfgh hunter buster soccer harley batman andrew tigger sunshine
iloveyou 2000 charlie robert thomas hockey ranger daniel starwars klaster 112233 george computer michelle jessica pepper 1111 zxcvbn
555555 11111111 131313 freedom 777777 pass maggie 159753 aaaaaa ginger princess joshua cheese amanda summer love ashley nicole
chelsea biteme matthew access yankees 987654321 dallas austin thunder taylor matrix admin welcome welcome1 password1 password123
passw0rd p@ssw0rd p@ssword letmein123 qwerty123 abc1234 iloveyou1 monkey123 dragon123 sunshine1 princess1 football1 1q2w3e4r 1q2w3e
qwe123 admin123 root toor test test123 guest changeme default secret login whatever mother family blink182 lakers liverpool
arsenal manutd barcelona realmadrid messi ronaldo pokemon naruto minecraft roblox fortnite singapore merlion sentosa kiasu
lahsiao sgsg sg1234 singapore123 sajc hello hello123 iloveu ilovemom angel flower orange banana apple cookie chocolate purple
hunter2 lovely babygirl qwertyui asdfghjkl zaq12wsx 1234qwer q1w2e3r4 123abc abcd1234 a1b2c3 888888 999999 123654 654123 987654
121314 147258 147258369 159357 789456 789456123 963852741 741852963 abcdef abcdefg abc123456 qwerty1 qwerty12 qwertyu
passpass password12 password1234 pass1234 pass123 iloveyou2 asdf1234 asdfasdf 1234abcd zxcvbnm123 mypassword mypass secret123
letmein1 trustno1! welcome123 admin1234 hello1234 ilovegod loveyou lovers sweety sweetie cutie honey1 monkey1 dragon1 master1
shadow1 killer1 ninja1 ninja pokemon1 batman1 superman1 spiderman marvel avengers ironman joker harrypotter hogwarts gandalf
liverpool1 chelsea1 arsenal1 mancity tottenham ronaldo7 messi10 cr7 neymar jordan23 kobe24 lebron23 starwars1 nintendo playstation
xbox123 gaming gamer123 player1 minecraft1 roblox123 genshin fortnite1 valorant discord tiktok instagram snapchat facebook google
google123 youtube amazon apple123 iphone samsung android windows linux hacker hacker123 cyber cyber123 python python3 java123
sentosa1 merlion1 singapore1 singapore2 sgpore lion1 tiger1 kopi teh bubbletea boba durian laksa satay chickenrice hawker mrt
bukitbatu ang1234 tan1234 lim1234 lee1234 wong1234`)
  .split(/\s+/).filter(Boolean);

// Ordinary words, names, places and hobbies a cracker's dictionary would cover.
export const WORDS = (`james john mary david daniel michael sarah jason kevin ryan justin ethan nathan aaron jessica jennifer emily rachel amanda ashley
joshua andrew matthew brian eric steven jacob alex alexis chris sam samuel ben benjamin luke lucas noah liam oliver emma olivia
sophia mia ava isabella grace chloe zoe lily ruby hannah megan natalie sophie victoria angela diana jasmine amy anna
tan lim lee wong ng chen kumar raj ravi priya arun siva kavi deepa ali ahmad muhammad nur siti aisha amir hakim farhan
aiden darren wei ming jun hao xin yi li zhang wang liu yang huang lin zhao zhou wu xu sun ma
love life star moon sun sky blue red black white green pink gold silver purple yellow brown grey orange
tiger lion eagle wolf bear panda cat dog fish bird horse snake dragon phoenix shark dolphin rabbit mouse kitty puppy
king queen prince princess ninja pirate knight wizard hero angel devil ghost zombie robot alien
monday tuesday wednesday thursday friday saturday sunday january february march april june july august september october november december
spring summer autumn winter rainy sunny
football soccer basketball tennis badminton swimming running cycling hockey rugby cricket golf chess guitar piano violin drums music
dance art draw sing gaming gamer anime manga kpop taylor swift bieber blackpink bts
pizza burger noodle noodles rice chicken coffee tea milk bubble sushi ramen pasta chocolate cake cookie candy icecream
school student junior college class math physics chem chemistry bio biology econ economics english history geography science exam study
home house family mother father mom dad brother sister baby friend friends best forever always never
computer laptop phone mobile internet online cyber hacker python java code coding program secure security shield cipher secret
singapore sentosa merlion orchard changi bedok tampines jurong woodlands yishun punggol sengkang clementi bishan toa payoh
hello welcome please thanks sorry happy lucky smile cool super mega ultra power magic dream wish hope faith`)
  .split(/\s+/).filter(Boolean);

// Easy-to-type words for passphrases (3-8 letters, no look-alikes with common passwords).
export const PASSPHRASE = [...new Set((`
acorn actor adopt agent aisle alarm album alert algae alien alley almond alpine amber ankle apron arena armor arrow aspen atlas attic audio
autumn avocado badge bagel baker bamboo banjo barn basil basket beach beacon beaver berry bike birch bison blanket blaze bloom boat bonus
boots brave bread brick bridge brook broom bubble bucket bundle butter cabin cable cactus camel candle canoe canyon carpet castle cedar cello
chair chalk cherry cliff clock cloud clover cobra coast cocoa comet copper coral cotton cradle crane crayon creek crown crystal cycle daisy
dance delta denim desert diary dinner dock dolphin donkey dream drift drum eagle earth echo eclipse elbow ember engine fabric falcon feather
fern ferry fiddle field finch flame flint flute forest fossil fox frost galaxy garden garlic geese glacier globe glove goose grape gravel
grove guitar hammer harbor hazel heron honey horizon hotel island ivory jacket jaguar jelly jewel jungle kayak kettle kitten ladder lagoon
lake lantern lemon lentil lizard lotus magnet mango maple marble meadow melon mirror mitten moose mosaic mountain muffin napkin nectar needle
nickel noodle north nutmeg oasis ocean olive onion orbit orchid otter oyster paddle palace panda paper parrot pasta peach pebble pencil
penguin pepper piano picnic pillow pilot planet plum pocket poem pond poppy puffin pumpkin puzzle quartz quilt rabbit radar rainbow raven
reef ribbon river robin rocket saddle safari sailor salmon sand sapphire scarf season shell shore silver sketch sleigh smoke snail socks
solar spark spider spoon spring squid squirrel stable star stone storm sugar summit sunset swan tablet timber toast tomato tower trail train
tulip tunnel turtle umbrella valley velvet violin walnut water wave willow window winter wizard wolf yacht yellow zebra zephyr
anchor antler apricot arcade badger banner barrel beetle bell belt bench biscuit bottle bounce branch breeze bronze button cabbage camera
candy captain carrot cart cashew cattle cheese chimney circus citrus clay cloak clown coin collar compass cookie corner cosmos cougar
cricket crumb cupboard curtain dagger dawn dingo dish diver domino dove dune dust ebony elder emerald fable fairy feast fence fiber figure
flag fleet flower foam fork fountain frog gadget gallop gentle ghost giant glass glider goblet gold gopher gown gravy gull hammock harp hat
hawk heart hedge helmet hermit hiker hill hollow hoop hornet hound hut iceberg igloo inkwell insect jade jam jar jazz jester jigsaw jockey
joker journal juice kangaroo kernel key kingdom kiwi knight knot koala lace lamb lamp lark laser leaf ledge lemur lilac lime linen llama
lobster locket lodge lunar lynx magic mallet manor map marsh mask mast medal melody mint mist mole monsoon moon moss moth mule museum
mushroom nest net noble nomad notch oak oar oatmeal octopus opal owl paint pail pantry parade patch peanut pear pelican pie pigeon pine
pirate plank plaza plow plume polar pony pottery prairie prism pudding pulse quail quest quiver radish raft rain ranch ridge ring roast rose
rudder ruby saffron sage sail salad satin sauce scout seal shark sheep shield shovel signal silk skate sled slope snow sofa sparrow spice
spire sponge spruce stamp steam stew stool straw stream sundae swing sword syrup taco tango teapot temple tent thistle thunder ticket tide
toad toffee torch tractor trout trumpet tuba tundra twig unicorn urchin vase vessel vine vista voyage waffle wagon walrus weaver whale wheat
whisk wicker wind wing wool worm yarn yoga zinc zipper`).split(/\s+/).filter((w) => w.length >= 3 && w.length <= 8))];

// Keyboard runs an attacker tries early.
export const KEYBOARD = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890', 'qazwsxedcrfvtgb', '1qaz2wsx3edc4rfv', '1q2w3e4r5t6y', 'qweasdzxc', 'zaq12wsx', '1qazxsw2'];
