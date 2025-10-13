const cuteMessages = [
    // --- Personalized Messages (loginStatus: true) ---
    { loginStatus: true, message: "Heeeeyyy, fabulous {userName}~! (⁄⁄>ω<⁄⁄)♡ I hope you brought your sparkle today! You’re here! You’re finally here! ＼(≧▽≦)／" },
    { loginStatus: true, message: "Guess who just logged in? The one and only {userName}! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ My day just got 1000% better! ～(￣▽￣～) Welcome back, superstar!! ☆彡" },
    { loginStatus: true, message: "Be still my heart! It’s {userName}! (づ｡◕‿‿◕｡)づ Sending you the biggest, fluffiest virtual hug! (っ˘ω˘ς) May your coffee be strong and your code run perfectly! (☞ﾟヮﾟ)☞" },
    { loginStatus: true, message: "Did someone say {userName} was here?! (⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄ You’re making me blush! So happy to see your bright virtual face! (*≧▽≦)ﾉ Let's make some magic~ ☆⌒(> _ < )" },
    { loginStatus: true, message: "Ding ding!! (￣▽￣)ノ A wild {userName} appeared! ヽ(★ω★)ノ You win the prize for 'Most Delightful Person to Show Up Today!' ＼(≧◡≦)/" },
    { loginStatus: true, message: "Psst... {userName}! (¬‿¬ ) Just wanted to say you’re awesome! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ Now go conquer the whatever, you glorious human!! (ง •̀_•́)ง" },
    { loginStatus: true, message: "Oh my goodness, it’s the legendary {userName}! (⊙﹏⊙✿) The site just wasn’t the same without you~ Welcome!! (つ≧▽≦)つ" },
    { loginStatus: true, message: "Hello there, {userName}! (＾▽＾)／ Your presence has officially unlocked 'Extreme Happiness Mode'!! ＼(￣▽￣)／" },
    { loginStatus: true, message: "Hold the phone! (╯✧▽✧)╯ It’s {userName}! Everything stops now because YOU are the main event! ＼(＾▽＾)／ YIPPEEE!! (งˆ▽ˆ)ง" },
    { loginStatus: true, message: "A friendly wave for {userName}! ヾ(・ω・*)ノ May your cookies be fresh and your internet fast! (≧∇≦)/ So glad you’re here~!" },
    { loginStatus: true, message: "Look who popped in! {userName}! (ﾉ≧∀≦)ﾉ Time to party~!! Ｏ(≧∇≦)Ｏ I even baked a digital cake just for you~ ヽ(〃＾▽＾〃)ﾉ" },
    { loginStatus: true, message: "I was just thinking about you, {userName}! (ღ✪v✪) Coincidence?! Nope—destiny!! (つ✧ω✧)つ" },
    { loginStatus: true, message: "The stars aligned and delivered {userName} to my screen~ ☆彡 You’re the best! Don’t let anyone tell you otherwise!! (≧◡≦)/" },
    { loginStatus: true, message: "Oh happy day!! ヾ(＠^▽^＠)ﾉ {userName} has graced us with their presence~ Time to buckle up and have some fun!! ヽ(＾Д＾)ﾉ" },
    { loginStatus: true, message: "Is that {userName} I see? (o_O) You’re looking radiant today~ ✧(>o<)✧ Thanks for brightening this little corner of the web~ (´▽`ʃ♡ƪ)" },
    { loginStatus: true, message: "Stop scrolling!! (ﾉ≧ڡ≦) Official welcome notification for {userName}! We missed your sparkle~ (≧ω≦)b" },
    { loginStatus: true, message: "My favorite user {userName} is here!! (*≧∀≦*) Prepare for a blast of sunshine and good vibes~ (☞ﾟヮﾟ)☞" },
    { loginStatus: true, message: "Welcome to the VIP section, {userName}! (๑˃̵ᴗ˂̵)و You deserve all the sparkly good things today~ ☆～（ゝ。∂）" },
    { loginStatus: true, message: "Hey {userName}! (✿◠‿◠) Virtual high-five incoming!! ✋ Glad you dropped by~ ( ´ ▽ ` )ﾉ" },
    { loginStatus: true, message: "System alert!! ( ⚆ _ ⚆ ) Pure wonderfulness detected! Must be {userName}! ヽ(♡‿♡)ノ Have an amazing time here!" },
    { loginStatus: true, message: "Hello hello, {userName}~! (•‿•)ゝ It’s me, your friendly site greeter~ Ready to embark on digital adventures~ o(〃＾▽＾〃)o" },
    { loginStatus: true, message: "It’s time for some internet fun with {userName}! ヽ(＾Д＾)ﾉ Let the good times roll~!! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧" },
    { loginStatus: true, message: "Top of the day to you, {userName}! (⌒▽⌒)☆ Hope you feel refreshed and ready to sparkle~ (❁´◡`❁)" },
    { loginStatus: true, message: "A giant, enthusiastic YES! {userName} is in the house~ (っ＾▿＾)っ Welcome welcome welcome~ (≧◡≦)" },
    { loginStatus: true, message: "Just a little note to say hi to {userName}~ (ﾉ´ヮ`)ﾉ*: ･ﾟ You make everything brighter just by existing~ (ღ˘⌣˘ღ)" },

    // --- Generic Messages (loginStatus: false) ---
    { loginStatus: false, message: "OH. MY. GOODNESS. You’re here!! ヽ(＾Д＾)ﾉ Welcome to the party~ ＼(☆o☆)／ So thrilled you stopped by~ ヽ(♡‿♡)ノ" },
    { loginStatus: false, message: "A dazzling hello from the entire team!! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ Sending the warmest digital welcome~ ヽ(＾Д＾)ﾉ Please enjoy your stay!" },
    { loginStatus: false, message: "Stop what you’re doing and accept this virtual bouquet!! (✿◠‿◠)✿ You are appreciated~ ヽ(＾Д＾)ﾉ" },
    { loginStatus: false, message: "Well hello there, sunshine~ (〃＾▽＾〃) Your arrival just triggered the JOY ALARM~ (ง’̀-‘́)ง Welcome!!" },
    { loginStatus: false, message: "Welcome, welcome, WELCOME~ (ﾉ≧∀≦)ﾉ Pop open the virtual bubbly~ ( ＾◡＾)っ🥂 You made it!" },
    { loginStatus: false, message: "Hey hey, fabulous human~ (≧◡≦)ノ We’re so excited to have you! Don’t be shy~ click all the things! Ｏ(≧∇≦)Ｏ" },
    { loginStatus: false, message: "Greetings, traveler!! ( ＾▽＾)／ You’ve landed in the happiest corner of the web~ (づ｡◕‿‿◕｡)づ" },
    { loginStatus: false, message: "Is it getting warm in here?! (//ω//) That’s the heat of our enthusiasm~ ヾ(＠⌒ー⌒＠)ノ Welcome!" },
    { loginStatus: false, message: "You’ve unlocked the Super Happy Site Experience!! (ﾉ≧∀≦)ﾉ Enjoy your digital adventure~ (＾▽＾)/" },
    { loginStatus: false, message: "Bonjour~ Hola~ Guten Tag~ Ｏ(≧▽≦)Ｏ No matter the language, we’re thrilled to see you here~ (´｡• ω •｡`)" },
    { loginStatus: false, message: "Sending pixelated confetti~ ☆⌒(≧▽​° ) Welcome welcome~ ヾ(＠＾▽＾＠)ﾉ" },
    { loginStatus: false, message: "Look around, stay a while, and let us know if you need anything~ (๑˃̵ᴗ˂̵)و Hello hello!! (＾▽＾)" },
    { loginStatus: false, message: "The adventure begins NOW~ (ง •̀_•́)ง Grab your gear and let’s go~ Ｏ(≧∇≦)Ｏ" },
    { loginStatus: false, message: "A quiet whisper of welcome~ ( ˘ ³˘)っ But actually, a loud HELLO!!! (ノ*°▽°*)" },
    { loginStatus: false, message: "If joy had a sound, it would be YOU showing up~ ♪ヽ( ⌒o⌒)人(⌒-⌒ )v♪" },
    { loginStatus: false, message: "Consider yourself officially greeted with MAXIMUM ENTHUSIASM!! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ Welcome~ (＾▽＾)/" },
    { loginStatus: false, message: "Did you just teleport here?! (⊙_◎) That was fast~ (ﾉ´ヮ`)ﾉ*:･ﾟ✧ We’re ready for you!" },
    { loginStatus: false, message: "A big bouncy hello to you~ (≧◡≦)/ Bounce your way around the site~ ヾ(＾∇＾)" },
    { loginStatus: false, message: "Tap tap tap... is this thing on? (•_•) YES! Testing 1-2-3~ Welcome live and loud!! ＼(￣▽￣)／" },
    { loginStatus: false, message: "Just stopping by to wave hi~ (≧◡≦)ノ You got this, superstar~ (๑•̀ㅂ•́)و✧" },
    { loginStatus: false, message: "It’s a beautiful day for browsing~ ( ´ ▽ ` )ﾉ Hope you enjoy every second~ (❁´◡`❁)" },
    { loginStatus: false, message: "We rolled out the virtual red carpet just for you~ (￣▽￣)ノ Come on in~ (＾▽＾)" },
    { loginStatus: false, message: "This is THE place to be~ (•̀ᴗ•́)و ̑̑ Thanks for dropping by~ (ﾉ´ヮ`)ﾉ*:･ﾟ✧" },
    { loginStatus: false, message: "Hello hello hello~ (≧∇≦)/ Can you hear me? Great!! (o^▽^o) Welcome aboard~!" },
    { loginStatus: false, message: "Your presence is a present~ (づ￣ ³￣)づ Thank you for visiting~ ヽ(〃＾▽＾〃)ﾉ" },
    { loginStatus: true, message: "DESTROYYYYYYY~ ୧(๑•̀ᗝ•́)૭" },
];

export function getCuteMessage(user) {
    const userName = user?.name || "Lord Arbiter";

    const availableMessages = user
        ? cuteMessages
        : cuteMessages.filter(msg => msg.loginStatus === false);

    const randomMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];

    return randomMessage.message.replace(/{userName}/g, userName);
}

export default function HeartSmileIcon({ size = 24, color = "#e3e3e3" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            height={`${size}px`}
            viewBox="0 -960 960 960"
            width={`${size}px`}
            fill={color}
        >
            <path d="M480-340q63 0 112-39t63-101h-83q-12 27-37 43.5T480-420q-30 0-55-16.5T388-480h-83q14 62 63 101t112 39ZM370-540q21 0 35.5-14.5T420-590q0-21-14.5-35.5T370-640q-21 0-35.5 14.5T320-590q0 21 14.5 35.5T370-540Zm220 0q21 0 35.5-14.5T640-590q0-21-14.5-35.5T590-640q-21 0-35.5 14.5T540-590q0 21 14.5 35.5T590-540ZM480-120l-58-50q-101-88-167-152T150-437q-39-51-54.5-94T80-620q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 89T810-437q-39 51-105 115T538-170l-58 50Zm0-108q96-83 158-141t98-102.5q36-44.5 50-79t14-69.5q0-60-40-100t-100-40q-47 0-87 26.5T518-666h-76q-15-41-55-67.5T300-760q-60 0-100 40t-40 100q0 35 14 69.5t50 79Q260-427 322-369t158 141Zm0-266Z" />
        </svg>
    );
}