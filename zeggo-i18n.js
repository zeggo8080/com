/* ZEGGO i18n — English <-> বাংলা (Phase 2)
 * - English is the default. Choice is stored in localStorage key "zeggo_lang".
 * - Translates text nodes + aria-label/placeholder/title/alt, including nodes the app
 *   creates later (MutationObserver, active only while Bengali is selected).
 * - Original English is remembered per node, so switching back restores it exactly.
 * - Dictionary key = the exact English source string used by the app (see NOTE below).
 * - Strings with no Bengali entry are left in English and listed in ZEGGO_I18N.missing
 *   (open the site with ?i18n=debug to also see them in the console).
 * NOTE: the app builds ~700 strings inside JS, so the English text itself is used as the
 *       lookup key instead of rewriting every call site. Add `data-i18n-skip` to any element
 *       whose text must never be translated.
 */
(function () {
  'use strict';
  if (window.ZEGGO_I18N) return; /* never initialise (or bind listeners) twice */

  var KEY = 'zeggo_lang';
  var D = Object.create(null); /* exact-string dictionary */
  var P = []; /* [RegExp, function(match)->string] for strings with numbers/names */
  var ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  var tmap = new WeakMap(); /* text node  -> {en, bn} */
  var amap = new WeakMap(); /* element    -> { attr: {en, bn} } */
  var RD = null; /* lazy reverse dictionary (bn -> en) */
  var lang = 'en';
  var obs = null;

  function add(o) { for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) D[k] = o[k]; }

  /* ------------------------------------------------------------------ *
   * 1. DICTIONARY — static HTML text
   * ------------------------------------------------------------------ */
  add({
    'A gaming competition and creator community, starting with Free Fire.': 'একটি গেমিং প্রতিযোগিতা ও ক্রিয়েটর কমিউনিটি, শুরুতে Free Fire দিয়ে।',
    'About': 'পরিচিতি',
    'About ZEGGO': 'ZEGGO সম্পর্কে',
    'Account': 'অ্যাকাউন্ট',
    'Account / Login': 'অ্যাকাউন্ট / লগইন',
    'Achievements': 'অর্জন',
    'All': 'সব',
    'All statuses': 'সব স্ট্যাটাস',
    'All time': 'সর্বকালের',
    'All tournaments': 'সব টুর্নামেন্ট',
    'Announcements': 'ঘোষণা',
    "Answers from ZEGGO's published rules and FAQ. Open a question to read the answer.": 'ZEGGO-র প্রকাশিত নিয়ম ও সাধারণ জিজ্ঞাসার উত্তর। উত্তর পড়তে একটি প্রশ্ন খুলুন।',
    'Articles': 'আর্টিকেল',
    'At least 6 characters. The site may ask for a stronger password.': 'কমপক্ষে 6টি অক্ষর। সাইট আরও শক্তিশালী পাসওয়ার্ড চাইতে পারে।',
    'Back to Sign In': 'সাইন ইনে ফিরে যান',
    'Between 10 and 2,000 characters. Include what you expected and what happened.': '10 থেকে 2,000 অক্ষরের মধ্যে। আপনি কী আশা করেছিলেন এবং কী ঘটেছে তা লিখুন।',
    'Bracket': 'ব্র্যাকেট',
    'Browse tournaments': 'টুর্নামেন্ট দেখুন',
    'Bug Report': 'বাগ রিপোর্ট',
    'Bundle 01 — design preview': 'বান্ডল 01 — ডিজাইন প্রিভিউ',
    'Cancel': 'বাতিল করুন',
    'Cancel registration': 'নিবন্ধন বাতিল করুন',
    'Cancel registration?': 'নিবন্ধন বাতিল করবেন?',
    'Cancelled': 'বাতিল',
    'Capital letters and extra spaces are ignored. Only published tournament results are searched.': 'বড় হাতের অক্ষর ও অতিরিক্ত স্পেস উপেক্ষা করা হয়। শুধু প্রকাশিত টুর্নামেন্টের ফলাফলে খোঁজা হয়।',
    'Cart': 'কার্ট',
    'Categories': 'ক্যাটাগরি',
    'Category': 'ক্যাটাগরি',
    'Checkout': 'চেকআউট',
    'Choose a category': 'একটি ক্যাটাগরি বেছে নিন',
    'Choose a tournament': 'একটি টুর্নামেন্ট বেছে নিন',
    'Choose an issue type': 'সমস্যার ধরন বেছে নিন',
    'Close': 'বন্ধ করুন',
    'Community': 'কমিউনিটি',
    'Compete. Create.': 'প্রতিযোগিতা করুন। তৈরি করুন।',
    'Completed': 'সম্পন্ন',
    'Confirm password': 'পাসওয়ার্ড নিশ্চিত করুন',
    'Contact': 'যোগাযোগ',
    'Continue with Google': 'Google দিয়ে চালিয়ে যান',
    'Create Account': 'অ্যাকাউন্ট তৈরি করুন',
    'Creators': 'ক্রিয়েটর',
    'Date range': 'তারিখের পরিসর',
    'Days': 'দিন',
    'Done': 'সম্পন্ন',
    'Email address': 'ইমেইল ঠিকানা',
    'Enter the email address you signed up with. If an eligible account exists, a password-reset email should arrive shortly.': 'যে ইমেইল ঠিকানা দিয়ে সাইন আপ করেছেন সেটি লিখুন। যোগ্য অ্যাকাউন্ট থাকলে শীঘ্রই পাসওয়ার্ড রিসেট ইমেইল আসবে।',
    'Entry type, format and start time at a glance. Only tournaments published by ZEGGO appear here.': 'এক নজরে এন্ট্রির ধরন, ফরম্যাট ও শুরুর সময়। এখানে শুধু ZEGGO-র প্রকাশিত টুর্নামেন্ট দেখানো হয়।',
    'Everything in one place': 'সবকিছু এক জায়গায়',
    'Evidence link (optional)': 'প্রমাণের লিংক (ঐচ্ছিক)',
    'Explain the issue': 'সমস্যাটি ব্যাখ্যা করুন',
    'Explore': 'এক্সপ্লোর',
    'Featured': 'ফিচার্ড',
    'Filters': 'ফিল্টার',
    'Find a player': 'খেলোয়াড় খুঁজুন',
    'Forgot password?': 'পাসওয়ার্ড ভুলে গেছেন?',
    'Free Fire nickname or UID': 'Free Fire ডাকনাম বা UID',
    'Free and paid entry': 'ফ্রি ও পেইড এন্ট্রি',
    'Free and paid-entry events published by ZEGGO.': 'ZEGGO-র প্রকাশিত ফ্রি ও পেইড এন্ট্রির ইভেন্ট।',
    'Free entry': 'ফ্রি এন্ট্রি',
    'From published results': 'প্রকাশিত ফলাফল থেকে',
    'Full name': 'পূর্ণ নাম',
    'Gaming': 'গেমিং',
    'Gaming articles and news': 'গেমিং আর্টিকেল ও খবর',
    'Gaming shorts': 'গেমিং শর্টস',
    'General': 'সাধারণ',
    'Get seen.': 'নজরে আসুন।',
    'Google sign-in and email sign-in are separate accounts, even if the email address is the same.': 'ইমেইল ঠিকানা একই হলেও Google সাইন-ইন ও ইমেইল সাইন-ইন আলাদা অ্যাকাউন্ট।',
    'Guides, event recaps and community news published by ZEGGO.': 'ZEGGO-র প্রকাশিত গাইড, ইভেন্টের সারসংক্ষেপ ও কমিউনিটি সংবাদ।',
    'Guides, recaps and community news.': 'গাইড, সারসংক্ষেপ ও কমিউনিটি সংবাদ।',
    'Home': 'হোম',
    'Hours': 'ঘণ্টা',
    'How ZEGGO ranks: Points are the sum of recorded scores from published matches; a result with no score adds zero. Ties are broken by wins, then best placement, then name. Matches counts the published matches a name appeared in. These are ZEGGO rankings, not official Garena or Free Fire rankings.': 'ZEGGO কীভাবে র‍্যাংক করে: প্রকাশিত ম্যাচের রেকর্ড করা স্কোরের যোগফলই পয়েন্ট; স্কোরবিহীন ফলাফলে শূন্য যোগ হয়। সমান পয়েন্টে আগে জয়, তারপর সেরা অবস্থান, তারপর নাম দিয়ে নির্ধারণ করা হয়। ম্যাচ বলতে প্রকাশিত যত ম্যাচে নামটি এসেছে তার সংখ্যা। এগুলো ZEGGO-র র‍্যাংকিং, Garena বা Free Fire-এর অফিসিয়াল র‍্যাংকিং নয়।',
    'Incorrect placement/score': 'ভুল অবস্থান/স্কোর',
    'Incorrect result': 'ভুল ফলাফল',
    'Issue type': 'সমস্যার ধরন',
    'I’ve verified my email': 'আমি আমার ইমেইল যাচাই করেছি',
    'Jump to a section. Tournaments, shorts, videos, articles and the leaderboard are all live.': 'যেকোনো বিভাগে যান। টুর্নামেন্ট, শর্টস, ভিডিও, আর্টিকেল ও লিডারবোর্ড সবই চালু আছে।',
    'Keep registration': 'নিবন্ধন রাখুন',
    'Last 30 days': 'গত 30 দিন',
    'Last 365 days': 'গত 365 দিন',
    'Last 90 days': 'গত 90 দিন',
    'Latest from ZEGGO': 'ZEGGO-র সর্বশেষ',
    'Leaderboard': 'লিডারবোর্ড',
    'Live': 'লাইভ',
    'Loading articles…': 'আর্টিকেল লোড হচ্ছে…',
    'Loading shorts…': 'শর্টস লোড হচ্ছে…',
    'Loading tournaments…': 'টুর্নামেন্ট লোড হচ্ছে…',
    'Loading videos…': 'ভিডিও লোড হচ্ছে…',
    'Long videos': 'লং ভিডিও',
    'Long-form match breakdowns and tutorials.': 'বিস্তারিত ম্যাচ বিশ্লেষণ ও টিউটোরিয়াল।',
    'Mark all as read': 'সব পঠিত হিসেবে চিহ্নিত করুন',
    'Market': 'মার্কেট',
    'Marketplace': 'মার্কেটপ্লেস',
    'Marketplace is under construction. Gaming tournaments are unchanged.': 'মার্কেটপ্লেস নির্মাণাধীন। গেমিং টুর্নামেন্ট আগের মতোই আছে।',
    'Match / Room Issue': 'ম্যাচ / রুম সমস্যা',
    'Match history': 'ম্যাচের ইতিহাস',
    'Match issue': 'ম্যাচ সমস্যা',
    'Match results': 'ম্যাচের ফলাফল',
    'Match schedule and rooms': 'ম্যাচের সূচি ও রুম',
    'Match status': 'ম্যাচের অবস্থা',
    'Matches': 'ম্যাচ',
    'Message': 'বার্তা',
    'Minutes': 'মিনিট',
    'Missing result': 'ফলাফল অনুপস্থিত',
    'My registrations': 'আমার নিবন্ধন',
    'Need help?': 'সাহায্য দরকার?',
    'New arrivals': 'নতুন আগমন',
    'New here? Switch to Create Account': 'নতুন? অ্যাকাউন্ট তৈরি করুন-এ যান',
    'Next match': 'পরবর্তী ম্যাচ',
    'Next tournament': 'পরবর্তী টুর্নামেন্ট',
    'Notifications': 'নোটিফিকেশন',
    'Open articles': 'আর্টিকেল খুলুন',
    'Open leaderboard': 'লিডারবোর্ড খুলুন',
    'Open shorts': 'শর্টস খুলুন',
    'Open tournaments': 'টুর্নামেন্ট খুলুন',
    'Open videos': 'ভিডিও খুলুন',
    'Orders': 'অর্ডার',
    'Other': 'অন্যান্য',
    'Paid entry': 'পেইড এন্ট্রি',
    'Password': 'পাসওয়ার্ড',
    'Payments': 'পেমেন্ট',
    'Placements and scores from completed matches that ZEGGO has published.': 'ZEGGO-র প্রকাশিত সম্পন্ন ম্যাচের অবস্থান ও স্কোর।',
    'Player / Team': 'খেলোয়াড় / টিম',
    'Player profile': 'খেলোয়াড়ের প্রোফাইল',
    'Player support': 'প্লেয়ার সাপোর্ট',
    'Players and teams': 'খেলোয়াড় ও টিম',
    'Points': 'পয়েন্ট',
    'Products': 'পণ্য',
    'Products sold directly by ZEGGO.': 'ZEGGO-র সরাসরি বিক্রি করা পণ্য।',
    'Quick clips from approved creators.': 'অনুমোদিত ক্রিয়েটরদের দ্রুত ক্লিপ।',
    'Quick clips from approved creators. Only content published by ZEGGO appears here.': 'অনুমোদিত ক্রিয়েটরদের দ্রুত ক্লিপ। এখানে শুধু ZEGGO-র প্রকাশিত কনটেন্ট দেখানো হয়।',
    'Rank': 'র‍্যাংক',
    'Rankings from published ZEGGO match results.': 'ZEGGO-র প্রকাশিত ম্যাচের ফলাফল থেকে র‍্যাংকিং।',
    'Refresh': 'রিফ্রেশ',
    'Register': 'নিবন্ধন করুন',
    'Registration': 'নিবন্ধন',
    'Registration submitted': 'নিবন্ধন জমা হয়েছে',
    'Registration, match, result and announcement updates for your account. Shown only to you.': 'আপনার অ্যাকাউন্টের নিবন্ধন, ম্যাচ, ফলাফল ও ঘোষণার আপডেট। শুধু আপনাকেই দেখানো হয়।',
    'Report a match issue': 'ম্যাচ সমস্যা জানান',
    'Report sent': 'রিপোর্ট পাঠানো হয়েছে',
    'Reporting an issue does not change any published result, leaderboard or bracket. The ZEGGO team reviews each report manually.': 'সমস্যা জানালে প্রকাশিত কোনো ফলাফল, লিডারবোর্ড বা ব্র্যাকেট বদলায় না। ZEGGO টিম প্রতিটি রিপোর্ট নিজে যাচাই করে।',
    'Resend verification email': 'যাচাইকরণ ইমেইল আবার পাঠান',
    'Reset': 'রিসেট',
    'Results': 'ফলাফল',
    'Results / Leaderboard': 'ফলাফল / লিডারবোর্ড',
    "Rounds, matches and winners. A winner is shown only after ZEGGO publishes that match's results.": 'রাউন্ড, ম্যাচ ও বিজয়ী। ZEGGO সেই ম্যাচের ফলাফল প্রকাশ করার পরই বিজয়ী দেখানো হয়।',
    'Rules': 'নিয়ম',
    'Rules & FAQ': 'নিয়ম ও সাধারণ জিজ্ঞাসা',
    'Scheduled': 'নির্ধারিত',
    'Search': 'খুঁজুন',
    'Search by Free Fire nickname or UID to see published match history. No sign-in needed.': 'প্রকাশিত ম্যাচের ইতিহাস দেখতে Free Fire ডাকনাম বা UID দিয়ে খুঁজুন। সাইন ইন লাগবে না।',
    'Search products': 'পণ্য খুঁজুন',
    'Seconds': 'সেকেন্ড',
    'Send report': 'রিপোর্ট পাঠান',
    'Send request': 'অনুরোধ পাঠান',
    'Send reset email': 'রিসেট ইমেইল পাঠান',
    'Shop': 'শপ',
    'Shop ZEGGO': 'ZEGGO শপ',
    'Shorts': 'শর্টস',
    'Shorts and long videos': 'শর্টস ও লং ভিডিও',
    'Show': 'দেখান',
    'Sign In': 'সাইন ইন',
    'Sign in': 'সাইন ইন',
    'Skip to content': 'মূল অংশে যান',
    'Stay here': 'এখানেই থাকুন',
    'Subject': 'বিষয়',
    'Submit registration': 'নিবন্ধন জমা দিন',
    'Teams and players': 'টিম ও খেলোয়াড়',
    'Tell us what happened and our team will review it. You do not need to sign in.': 'কী ঘটেছে জানান, আমাদের টিম যাচাই করবে। সাইন ইন করার দরকার নেই।',
    'Tournament': 'টুর্নামেন্ট',
    'Tournament Registration': 'টুর্নামেন্ট নিবন্ধন',
    'Tournament bracket': 'টুর্নামেন্ট ব্র্যাকেট',
    'Tournament or match reference (optional)': 'টুর্নামেন্ট বা ম্যাচের রেফারেন্স (ঐচ্ছিক)',
    'Tournament registration': 'টুর্নামেন্ট নিবন্ধন',
    'Tournament rules and common questions': 'টুর্নামেন্টের নিয়ম ও সাধারণ প্রশ্ন',
    'Tournaments': 'টুর্নামেন্ট',
    'Tournaments you have registered for and the current status of each registration.': 'আপনি যেসব টুর্নামেন্টে নিবন্ধন করেছেন এবং প্রতিটির বর্তমান অবস্থা।',
    'Try again': 'আবার চেষ্টা করুন',
    'Unread': 'অপঠিত',
    'Upcoming': 'আসন্ন',
    'Upcoming tournaments': 'আসন্ন টুর্নামেন্ট',
    'Verify email': 'ইমেইল যাচাই করুন',
    'Videos': 'ভিডিও',
    'View leaderboard': 'লিডারবোর্ড দেখুন',
    'View my registrations': 'আমার নিবন্ধন দেখুন',
    'Visible only for approved registrations. Room details are shown only to approved players.': 'শুধু অনুমোদিত নিবন্ধনের জন্য দৃশ্যমান। রুমের তথ্য শুধু অনুমোদিত খেলোয়াড়দের দেখানো হয়।',
    'Wins': 'জয়',
    'Wrong player/team attribution': 'ভুল খেলোয়াড়/টিম উল্লেখ',
    'Your cart': 'আপনার কার্ট',
    'Your entries': 'আপনার এন্ট্রি',
    'Your matches': 'আপনার ম্যাচ',
    'Your orders': 'আপনার অর্ডার',
    'Your updates': 'আপনার আপডেট',
    'ZEGGO is a gaming competition and creator community. We start with Free Fire: tournaments, leaderboards, short videos and articles from approved creators.': 'ZEGGO একটি গেমিং প্রতিযোগিতা ও ক্রিয়েটর কমিউনিটি। আমরা শুরু করছি Free Fire দিয়ে: অনুমোদিত ক্রিয়েটরদের টুর্নামেন্ট, লিডারবোর্ড, শর্ট ভিডিও ও আর্টিকেল।',
    'ZEGGO is an independent community. It is not affiliated with or endorsed by Garena or Free Fire. Tournaments listed here are published by ZEGGO. All players, scores and other content on this page are sample data for design review.': 'ZEGGO একটি স্বাধীন কমিউনিটি। এটি Garena বা Free Fire-এর সঙ্গে সম্পৃক্ত নয় এবং তাদের দ্বারা অনুমোদিতও নয়। এখানে তালিকাভুক্ত টুর্নামেন্ট ZEGGO প্রকাশ করেছে। এই পেজের সব খেলোয়াড়, স্কোর ও অন্যান্য কনটেন্ট ডিজাইন পর্যালোচনার নমুনা তথ্য।',
    'ZEGGO leaderboard from published match results': 'প্রকাশিত ম্যাচের ফলাফল থেকে ZEGGO লিডারবোর্ড',
    "ZEGGO rankings, calculated from ZEGGO's published tournament match results.": 'ZEGGO-র প্রকাশিত টুর্নামেন্ট ম্যাচের ফলাফল থেকে গণনা করা ZEGGO র‍্যাংকিং।',
    'or': 'অথবা',
    '← Back to Marketplace': '← মার্কেটপ্লেসে ফিরুন',
    '← Back to cart': '← কার্টে ফিরুন',
    '← Back to catalog': '← ক্যাটালগে ফিরুন',
    '← Continue shopping': '← কেনাকাটা চালিয়ে যান'
  });

  /* attribute-only strings (aria-label / placeholder / title / alt) */
  add({
    'About page': 'পরিচিতি পেজ',
    'Close notifications': 'নোটিফিকেশন বন্ধ করুন',
    'Creator applications': 'ক্রিয়েটর আবেদন',
    'Enter nickname or UID': 'ডাকনাম বা UID লিখুন',
    'Filter FAQs by category': 'ক্যাটাগরি অনুযায়ী সাধারণ জিজ্ঞাসা ফিল্টার করুন',
    'Filter and sort products': 'পণ্য ফিল্টার ও সাজান',
    'Filter by category': 'ক্যাটাগরি অনুযায়ী ফিল্টার',
    'Filter match history': 'ম্যাচের ইতিহাস ফিল্টার করুন',
    'Filter notifications': 'নোটিফিকেশন ফিল্টার করুন',
    'Filter tournaments': 'টুর্নামেন্ট ফিল্টার করুন',
    'Filter your matches': 'আপনার ম্যাচ ফিল্টার করুন',
    'Main': 'প্রধান',
    'Open menu': 'মেনু খুলুন',
    'Close menu': 'মেনু বন্ধ করুন',
    'Primary': 'প্রাথমিক',
    'Sign in or create account': 'সাইন ইন করুন বা অ্যাকাউন্ট তৈরি করুন',
    'Time until next match': 'পরবর্তী ম্যাচ শুরু হতে বাকি সময়',
    'ZEGGO Marketplace home': 'ZEGGO মার্কেটপ্লেস হোম',
    'ZEGGO home': 'ZEGGO হোম',
    'ZEGGO mode': 'ZEGGO মোড',
    'ZEGGO leaderboard, scrolls horizontally on small screens': 'ZEGGO লিডারবোর্ড, ছোট স্ক্রিনে আড়াআড়ি স্ক্রল করে',
    'Tournament bracket, scrolls horizontally on small screens': 'টুর্নামেন্ট ব্র্যাকেট, ছোট স্ক্রিনে আড়াআড়ি স্ক্রল করে',
    'Numbers only': 'শুধু সংখ্যা',
    'Close filters': 'ফিল্টার বন্ধ করুন',
    'Check-in is open': 'চেক-ইন চালু আছে'
  });

  /* ------------------------------------------------------------------ *
   * 2. DICTIONARY — text generated by JavaScript (messages, states, labels)
   * ------------------------------------------------------------------ */
  add({
    /* auth */
    'Signing in…': 'সাইন ইন হচ্ছে…',
    'Signed in.': 'সাইন ইন হয়েছে।',
    'Signed out.': 'সাইন আউট হয়েছে।',
    'Sign out': 'সাইন আউট',
    'Sign-in failed. Please try again.': 'সাইন ইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
    'Sign-in was cancelled.': 'সাইন ইন বাতিল করা হয়েছে।',
    'Incorrect email or password.': 'ইমেইল বা পাসওয়ার্ড ভুল।',
    'Enter your email address.': 'আপনার ইমেইল ঠিকানা লিখুন।',
    'Enter a valid email address.': 'একটি সঠিক ইমেইল ঠিকানা লিখুন।',
    'Enter your password.': 'আপনার পাসওয়ার্ড লিখুন।',
    'Confirm your password.': 'আপনার পাসওয়ার্ড নিশ্চিত করুন।',
    'The two passwords do not match.': 'দুটি পাসওয়ার্ড মেলেনি।',
    'Password must be 6 to 128 characters.': 'পাসওয়ার্ড 6 থেকে 128 অক্ষরের হতে হবে।',
    'Enter your full name (at least 2 characters).': 'আপনার পূর্ণ নাম লিখুন (কমপক্ষে 2 অক্ষর)।',
    'Creating account…': 'অ্যাকাউন্ট তৈরি হচ্ছে…',
    'Create your account': 'আপনার অ্যাকাউন্ট তৈরি করুন',
    'Account created. You are signed in.': 'অ্যাকাউন্ট তৈরি হয়েছে। আপনি সাইন ইন করা আছেন।',
    'Account created. You are signed in. Requesting your verification email…': 'অ্যাকাউন্ট তৈরি হয়েছে। আপনি সাইন ইন করা আছেন। যাচাইকরণ ইমেইল অনুরোধ করা হচ্ছে…',
    'Account created. A verification email was requested; check your inbox and spam folder.': 'অ্যাকাউন্ট তৈরি হয়েছে। যাচাইকরণ ইমেইল অনুরোধ করা হয়েছে; ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।',
    'Account created and you are signed in. A verification email was requested; it should arrive shortly, so check your inbox and spam folder.': 'অ্যাকাউন্ট তৈরি হয়েছে এবং আপনি সাইন ইন করা আছেন। যাচাইকরণ ইমেইল অনুরোধ করা হয়েছে; শীঘ্রই আসবে, ইনবক্স ও স্প্যাম ফোল্ডার দেখুন।',
    'Account created and signed in, but the verification email could not be sent. Use “Verify email” in the header to try again.': 'অ্যাকাউন্ট তৈরি ও সাইন ইন হয়েছে, কিন্তু যাচাইকরণ ইমেইল পাঠানো যায়নি। আবার চেষ্টা করতে হেডারের “ইমেইল যাচাই করুন” ব্যবহার করুন।',
    'An account already exists for this email. Try signing in instead.': 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে। বরং সাইন ইন করে দেখুন।',
    'Already have an account? Switch to Sign In': 'আগে থেকেই অ্যাকাউন্ট আছে? সাইন ইনে যান',
    'Could not create your account. Please try again.': 'আপনার অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।',
    'Could not sign out. Please try again.': 'সাইন আউট করা যায়নি। আবার চেষ্টা করুন।',
    'Reset your password': 'পাসওয়ার্ড রিসেট করুন',
    'Could not send the reset email. Please try again.': 'রিসেট ইমেইল পাঠানো যায়নি। আবার চেষ্টা করুন।',
    'Verify your email': 'আপনার ইমেইল যাচাই করুন',
    'Your email address is not verified yet. Click to verify.': 'আপনার ইমেইল ঠিকানা এখনও যাচাই হয়নি। যাচাই করতে ক্লিক করুন।',
    'Your email address is verified.': 'আপনার ইমেইল ঠিকানা যাচাই করা হয়েছে।',
    'Your email address is now verified.': 'আপনার ইমেইল ঠিকানা এখন যাচাই করা হয়েছে।',
    'Email verified': 'ইমেইল যাচাই হয়েছে',
    'Your email is not verified yet. Open the link in the verification email first, then press the button again.': 'আপনার ইমেইল এখনও যাচাই হয়নি। আগে যাচাইকরণ ইমেইলের লিংক খুলুন, তারপর বোতামটি আবার চাপুন।',
    'Google sign-in is not enabled yet. Please try again later.': 'Google সাইন-ইন এখনও চালু হয়নি। পরে আবার চেষ্টা করুন।',
    'Email sign-in is not enabled yet. Please try again later.': 'ইমেইল সাইন-ইন এখনও চালু হয়নি। পরে আবার চেষ্টা করুন।',
    'Password reset is not enabled yet. Please try again later.': 'পাসওয়ার্ড রিসেট এখনও চালু হয়নি। পরে আবার চেষ্টা করুন।',
    'Password reset is temporarily unavailable. Please try again later.': 'পাসওয়ার্ড রিসেট সাময়িকভাবে বন্ধ আছে। পরে আবার চেষ্টা করুন।',
    'Sign-in is temporarily unavailable. Please try again later.': 'সাইন ইন সাময়িকভাবে বন্ধ আছে। পরে আবার চেষ্টা করুন।',
    'Sign-in is temporarily unavailable. The rest of the site still works.': 'সাইন ইন সাময়িকভাবে বন্ধ আছে। সাইটের বাকি অংশ ঠিকমতো চলছে।',
    'Sign-in service could not load. The rest of the site still works.': 'সাইন-ইন সেবা লোড হয়নি। সাইটের বাকি অংশ ঠিকমতো চলছে।',
    'Signed in, but your profile could not be loaded.': 'সাইন ইন হয়েছে, কিন্তু আপনার প্রোফাইল লোড করা যায়নি।',
    'Signed in, but the profile service is unreachable right now.': 'সাইন ইন হয়েছে, কিন্তু প্রোফাইল সেবা এখন পাওয়া যাচ্ছে না।',
    'Popup was blocked. Redirecting to Google…': 'পপআপ ব্লক হয়েছে। Google-এ নিয়ে যাওয়া হচ্ছে…',
    'This account has been disabled. Please contact ZEGGO support.': 'এই অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে। অনুগ্রহ করে ZEGGO সাপোর্টের সঙ্গে যোগাযোগ করুন।',
    'That password is too weak. Use a longer password with a mix of characters.': 'পাসওয়ার্ডটি খুব দুর্বল। বিভিন্ন ধরনের অক্ষরসহ আরও লম্বা পাসওয়ার্ড দিন।',
    'Too many attempts. Please wait a moment and try again.': 'অনেকবার চেষ্টা করা হয়েছে। একটু অপেক্ষা করে আবার চেষ্টা করুন।',
    'Too many requests. Please wait a few minutes and try again.': 'অনেক বেশি অনুরোধ। কয়েক মিনিট অপেক্ষা করে আবার চেষ্টা করুন।',
    'Too many requests. Please wait a few minutes before trying again.': 'অনেক বেশি অনুরোধ। আবার চেষ্টার আগে কয়েক মিনিট অপেক্ষা করুন।',
    'Network problem. Check your connection and try again.': 'নেটওয়ার্ক সমস্যা। আপনার সংযোগ দেখে আবার চেষ্টা করুন।',
    'Check your connection and try again.': 'আপনার সংযোগ দেখে আবার চেষ্টা করুন।',
    'Something went wrong. Please try again in a moment.': 'কিছু একটা সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।',
    'Your session ended. Please sign in again.': 'আপনার সেশন শেষ হয়েছে। আবার সাইন ইন করুন।',
    'Your session has ended. Please sign in again.': 'আপনার সেশন শেষ হয়েছে। আবার সাইন ইন করুন।',
    'Your session ended. Please sign in again and reopen the form.': 'আপনার সেশন শেষ হয়েছে। আবার সাইন ইন করে ফর্মটি আবার খুলুন।',
    'Your session has expired. Please sign out and sign in again.': 'আপনার সেশনের মেয়াদ শেষ। সাইন আউট করে আবার সাইন ইন করুন।',
    'Your session is no longer valid. Please sign out and sign in again.': 'আপনার সেশন আর বৈধ নয়। সাইন আউট করে আবার সাইন ইন করুন।',
    'Still checking your sign-in. Try again in a moment.': 'সাইন-ইন যাচাই চলছে। একটু পরে আবার চেষ্টা করুন।',
    'Checking your sign-in…': 'সাইন-ইন যাচাই হচ্ছে…',
    'Sign in or create an account to register.': 'নিবন্ধন করতে সাইন ইন করুন বা অ্যাকাউন্ট তৈরি করুন।',
    'Sign in to register': 'নিবন্ধন করতে সাইন ইন করুন',
    'Sign in to see your orders': 'আপনার অর্ডার দেখতে সাইন ইন করুন',
    'Open · sign in to register': 'চালু · নিবন্ধন করতে সাইন ইন করুন',

    /* generic states */
    'Loading…': 'লোড হচ্ছে…',
    'Searching…': 'খোঁজা হচ্ছে…',
    'Sending…': 'পাঠানো হচ্ছে…',
    'Submitting…': 'জমা দেওয়া হচ্ছে…',
    'Checking…': 'যাচাই হচ্ছে…',
    'Cancelling…': 'বাতিল হচ্ছে…',
    'Retry': 'আবার চেষ্টা',
    'Hide': 'লুকান',
    'Open': 'চালু',
    'Closed': 'বন্ধ',
    'Details': 'বিস্তারিত',
    'Just now': 'এইমাত্র',
    'Read': 'পড়া হয়েছে',
    'Mark as read': 'পঠিত হিসেবে চিহ্নিত করুন',
    'Read article': 'আর্টিকেল পড়ুন',
    'View details': 'বিস্তারিত দেখুন',
    'Sort': 'সাজান',
    'Send': 'পাঠান',
    'Player': 'খেলোয়াড়',
    'Match': 'ম্যাচ',
    'Starts': 'শুরু',
    'Started': 'শুরু হয়েছে',
    'Entry': 'এন্ট্রি',
    'Slots': 'স্লট',
    'Free': 'ফ্রি',
    'Paid': 'পরিশোধিত',
    'Unpaid': 'অপরিশোধিত',
    'Solo': 'সোলো',
    'Squad': 'স্কোয়াড',
    'Teammates': 'সতীর্থ',
    'Prize pool': 'পুরস্কারের পুল',
    'To be announced': 'ঘোষণা করা হবে',
    'Date not announced': 'তারিখ ঘোষণা হয়নি',
    'Not specified': 'উল্লেখ নেই',
    'Not recorded': 'রেকর্ড নেই',
    'Not included': 'অন্তর্ভুক্ত নয়',
    'Not available yet': 'এখনও পাওয়া যাচ্ছে না',
    'Status unknown': 'অবস্থা অজানা',
    'Total score': 'মোট স্কোর',
    'Best placement': 'সেরা অবস্থান',
    'Score not recorded': 'স্কোর রেকর্ড নেই',
    'Placement not recorded': 'অবস্থান রেকর্ড নেই',
    'Round not set': 'রাউন্ড নির্ধারিত হয়নি',
    'Result not published': 'ফলাফল প্রকাশিত হয়নি',
    'Results published': 'ফলাফল প্রকাশিত',
    'Live now': 'এখন লাইভ',
    'Highlights': 'হাইলাইটস',
    'Match scheduled': 'ম্যাচ নির্ধারিত',
    'Match is live': 'ম্যাচ চলছে',
    'Match completed': 'ম্যাচ সম্পন্ন',
    'Match cancelled': 'ম্যাচ বাতিল',
    'New announcement': 'নতুন ঘোষণা',

    /* tournaments / registration */
    'Postponed': 'স্থগিত',
    'Tournament cancelled': 'টুর্নামেন্ট বাতিল',
    'Tournament postponed': 'টুর্নামেন্ট স্থগিত',
    'Tournament rescheduled': 'টুর্নামেন্টের সময় পরিবর্তিত',
    'Registration approved': 'নিবন্ধন অনুমোদিত',
    'Registration not approved': 'নিবন্ধন অনুমোদিত হয়নি',
    'Registration cancelled': 'নিবন্ধন বাতিল হয়েছে',
    'Registration closed': 'নিবন্ধন বন্ধ',
    'Registration unavailable': 'নিবন্ধন পাওয়া যাচ্ছে না',
    'Registered': 'নিবন্ধিত',
    'Waitlisted': 'অপেক্ষমাণ তালিকায়',
    'Approved': 'অনুমোদিত',
    'Rejected': 'প্রত্যাখ্যাত',
    'Pending review': 'পর্যালোচনার অপেক্ষায়',
    'Submitted': 'জমা দেওয়া হয়েছে',
    'Join waitlist': 'অপেক্ষমাণ তালিকায় যোগ দিন',
    'Leave waitlist': 'অপেক্ষমাণ তালিকা ছাড়ুন',
    'Check in': 'চেক-ইন',
    'Checked in': 'চেক-ইন হয়েছে',
    'Not checked in': 'চেক-ইন হয়নি',
    'Check-in closed': 'চেক-ইন বন্ধ',
    'Check-in unavailable': 'চেক-ইন পাওয়া যাচ্ছে না',
    'Checking in…': 'চেক-ইন হচ্ছে…',
    'Check-in confirmed. Good luck!': 'চেক-ইন নিশ্চিত হয়েছে। শুভকামনা!',
    'Check-in failed. Please try again.': 'চেক-ইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
    'Check-in is not allowed right now. Please try again later.': 'এই মুহূর্তে চেক-ইন করা যাবে না। পরে আবার চেষ্টা করুন।',
    'Check-in is not open for this match right now.': 'এই ম্যাচের জন্য এখন চেক-ইন চালু নেই।',
    'Only players with an approved registration can check in.': 'শুধু অনুমোদিত নিবন্ধনধারী খেলোয়াড়রা চেক-ইন করতে পারবেন।',
    'You are already checked in.': 'আপনি ইতিমধ্যে চেক-ইন করেছেন।',
    'This match is completed. Check-in is closed.': 'এই ম্যাচ সম্পন্ন হয়েছে। চেক-ইন বন্ধ।',
    'Your check-in status could not be loaded. Refresh the page and try again.': 'আপনার চেক-ইনের অবস্থা লোড করা যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।',
    'Add to Calendar: ': 'ক্যালেন্ডারে যোগ করুন: ',
    'Calendar file downloaded. Open it to add the match to your calendar.': 'ক্যালেন্ডার ফাইল ডাউনলোড হয়েছে। ম্যাচটি ক্যালেন্ডারে যোগ করতে ফাইলটি খুলুন।',
    'Your browser could not download the calendar file. Try another browser, or add the match manually using the date and time shown above.': 'আপনার ব্রাউজার ক্যালেন্ডার ফাইল ডাউনলোড করতে পারেনি। অন্য ব্রাউজার চেষ্টা করুন, বা উপরে দেখানো তারিখ ও সময় দিয়ে নিজে ম্যাচটি যোগ করুন।',
    'No published tournaments yet.': 'এখনও কোনো টুর্নামেন্ট প্রকাশিত হয়নি।',
    'Registration failed. Please try again.': 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
    'Registration for this tournament has been closed.': 'এই টুর্নামেন্টের নিবন্ধন বন্ধ করা হয়েছে।',
    'Registration is closed for this tournament.': 'এই টুর্নামেন্টের নিবন্ধন বন্ধ।',
    'Registration is not available for this tournament yet.': 'এই টুর্নামেন্টের নিবন্ধন এখনও শুরু হয়নি।',
    'You are already registered for this tournament.': 'আপনি এই টুর্নামেন্টে ইতিমধ্যে নিবন্ধিত।',
    'This tournament has already started, so registration is closed.': 'এই টুর্নামেন্ট শুরু হয়ে গেছে, তাই নিবন্ধন বন্ধ।',
    'This tournament has already finished.': 'এই টুর্নামেন্ট শেষ হয়ে গেছে।',
    'This tournament has been cancelled.': 'এই টুর্নামেন্ট বাতিল করা হয়েছে।',
    'This tournament is cancelled, so no action is needed.': 'এই টুর্নামেন্ট বাতিল, তাই কিছু করার দরকার নেই।',
    'This tournament is no longer open for registration.': 'এই টুর্নামেন্টে আর নিবন্ধন চালু নেই।',
    'This tournament mode is not supported.': 'এই টুর্নামেন্টের মোড সমর্থিত নয়।',
    'This tournament was changed by the organiser. Close this form and reopen it to see the latest details.': 'আয়োজক এই টুর্নামেন্ট পরিবর্তন করেছেন। সর্বশেষ তথ্য দেখতে ফর্মটি বন্ধ করে আবার খুলুন।',
    'A new date has not been announced yet.': 'নতুন তারিখ এখনও ঘোষণা করা হয়নি।',
    'Please fix the highlighted fields.': 'অনুগ্রহ করে চিহ্নিত ঘরগুলো সংশোধন করুন।',
    'Submit registration ': 'নিবন্ধন জমা দিন ',
    'Your registration starts as “Pending review”.': 'আপনার নিবন্ধন “পর্যালোচনার অপেক্ষায়” অবস্থায় শুরু হয়।',
    'Your registration will be cancelled. You will not be able to register again for this tournament from this page.': 'আপনার নিবন্ধন বাতিল করা হবে। এই পেজ থেকে আপনি আর এই টুর্নামেন্টে নিবন্ধন করতে পারবেন না।',
    'Could not cancel the registration. Nothing was changed. Please try again.': 'নিবন্ধন বাতিল করা যায়নি। কিছু পরিবর্তন হয়নি। আবার চেষ্টা করুন।',
    'This registration could not be found. Refresh the page.': 'এই নিবন্ধন খুঁজে পাওয়া যায়নি। পেজ রিফ্রেশ করুন।',
    'This registration does not belong to your account.': 'এই নিবন্ধন আপনার অ্যাকাউন্টের নয়।',
    'You do not have permission to register right now. Please sign in again or try later.': 'এখন নিবন্ধনের অনুমতি নেই। আবার সাইন ইন করুন বা পরে চেষ্টা করুন।',
    'You do not have permission to cancel this registration right now. Please try again later.': 'এই নিবন্ধন বাতিল করার অনুমতি এখন নেই। পরে আবার চেষ্টা করুন।',
    'Checking your registrations…': 'আপনার নিবন্ধন যাচাই হচ্ছে…',
    'Checking your registrations… try again in a moment.': 'আপনার নিবন্ধন যাচাই হচ্ছে… একটু পরে আবার চেষ্টা করুন।',
    'You can follow its status under My registrations.': 'আমার নিবন্ধন-এর অধীনে এর অবস্থা দেখতে পারবেন।',
    'Player 1 — Team Leader': 'খেলোয়াড় 1 — টিম লিডার',
    'Teammate email address': 'সতীর্থের ইমেইল ঠিকানা',
    'Player name': 'খেলোয়াড়ের নাম',
    'Free Fire UID': 'Free Fire UID',
    'Please choose all options first.': 'অনুগ্রহ করে আগে সব অপশন বেছে নিন।',

    /* leaderboard / profile / FAQ */
    'No shorts published yet': 'এখনও কোনো শর্টস প্রকাশিত হয়নি',
    'No long videos yet': 'এখনও কোনো লং ভিডিও নেই',
    'No articles published yet': 'এখনও কোনো আর্টিকেল প্রকাশিত হয়নি',
    'Quick clips from approved creators will appear here once ZEGGO publishes them.': 'ZEGGO প্রকাশ করলে অনুমোদিত ক্রিয়েটরদের দ্রুত ক্লিপ এখানে দেখা যাবে।',
    'Match breakdowns, tutorials and highlights will appear here once ZEGGO publishes them.': 'ZEGGO প্রকাশ করলে ম্যাচ বিশ্লেষণ, টিউটোরিয়াল ও হাইলাইটস এখানে দেখা যাবে।',
    'Guides, recaps and community news will appear here once ZEGGO publishes them.': 'ZEGGO প্রকাশ করলে গাইড, সারসংক্ষেপ ও কমিউনিটি সংবাদ এখানে দেখা যাবে।',
    'No image': 'ছবি নেই',
    'Search': 'খুঁজুন',
    'Player search is unavailable right now. The rest of the site still works.': 'প্লেয়ার সার্চ এখন পাওয়া যাচ্ছে না। সাইটের বাকি অংশ ঠিকমতো চলছে।',
    'Could not search right now. Check your connection and try again.': 'এখন খোঁজা যাচ্ছে না। আপনার সংযোগ দেখে আবার চেষ্টা করুন।',
    'No published matches fit these filters. Matches without a valid date are left out when a date range is chosen.': 'এই ফিল্টারে কোনো প্রকাশিত ম্যাচ মেলেনি। তারিখের পরিসর বাছলে বৈধ তারিখহীন ম্যাচ বাদ যায়।',
    'Matches with published results': 'ফলাফল প্রকাশিত ম্যাচ',
    'Published results have no 1st-place entry': 'প্রকাশিত ফলাফলে প্রথম স্থানের এন্ট্রি নেই',
    'Top-3 finishes': 'শীর্ষ-৩ ফিনিশ',
    'First-place wins': 'প্রথম স্থান জয়',
    'First-Place Finish': 'প্রথম স্থান অর্জন',
    'Top-Three Finish': 'শীর্ষ-তিন ফিনিশ',
    'First Published Match': 'প্রথম প্রকাশিত ম্যাচ',
    'Multiple Tournament Participant': 'একাধিক টুর্নামেন্টের অংশগ্রহণকারী',
    'Tournament Participant': 'টুর্নামেন্টের অংশগ্রহণকারী',
    'Has a recorded 1st placement in a published match.': 'প্রকাশিত ম্যাচে প্রথম স্থান রেকর্ড করা আছে।',
    'Has a recorded 1st, 2nd or 3rd placement in a published match.': 'প্রকাশিত ম্যাচে প্রথম, দ্বিতীয় বা তৃতীয় স্থান রেকর্ড করা আছে।',
    'Appears in at least 1 match whose results ZEGGO has published.': 'ZEGGO-র প্রকাশিত ফলাফলসহ অন্তত ১টি ম্যাচে আছে।',
    'Appears in the published results of at least 1 tournament.': 'অন্তত ১টি টুর্নামেন্টের প্রকাশিত ফলাফলে আছে।',
    'Appears in published results of 2 or more different tournaments.': '২ বা তার বেশি ভিন্ন টুর্নামেন্টের প্রকাশিত ফলাফলে আছে।',
    '(not earned yet)': '(এখনও অর্জিত হয়নি)',
    'Issues can only be reported for matches with published results or completed matches.': 'শুধু ফলাফল প্রকাশিত বা সম্পন্ন ম্যাচের সমস্যা জানানো যায়।',
    'You are signed in, so this report will be linked to your account.': 'আপনি সাইন ইন করা আছেন, তাই এই রিপোর্ট আপনার অ্যাকাউন্টের সঙ্গে যুক্ত হবে।',
    'Thanks. Your request has been sent to the ZEGGO team.': 'ধন্যবাদ। আপনার অনুরোধ ZEGGO টিমের কাছে পাঠানো হয়েছে।',
    'Your report was sent to the ZEGGO team. It does not change the published result. The team will review it.': 'আপনার রিপোর্ট ZEGGO টিমের কাছে পাঠানো হয়েছে। এটি প্রকাশিত ফলাফল বদলায় না। টিম এটি যাচাই করবে।',
    'You have already reported this match. The ZEGGO team will review it.': 'আপনি এই ম্যাচ ইতিমধ্যে রিপোর্ট করেছেন। ZEGGO টিম যাচাই করবে।',
    'You have already sent a report for this match from this browser. The ZEGGO team will review it.': 'এই ব্রাউজার থেকে আপনি এই ম্যাচের রিপোর্ট ইতিমধ্যে পাঠিয়েছেন। ZEGGO টিম যাচাই করবে।',
    'Could not send your report. Check your connection and try again. Your text is still here.': 'রিপোর্ট পাঠানো যায়নি। সংযোগ দেখে আবার চেষ্টা করুন। আপনার লেখা এখানেই আছে।',
    'Could not send your request. Check your connection and try again. Your message is still here.': 'অনুরোধ পাঠানো যায়নি। সংযোগ দেখে আবার চেষ্টা করুন। আপনার বার্তা এখানেই আছে।',
    'Sending your request…': 'আপনার অনুরোধ পাঠানো হচ্ছে…',
    'Choose an issue type.': 'সমস্যার ধরন বেছে নিন।',
    'Choose a category.': 'একটি ক্যাটাগরি বেছে নিন।',
    'Explain the issue in at least 10 characters.': 'সমস্যাটি কমপক্ষে 10 অক্ষরে ব্যাখ্যা করুন।',
    'Explanation must be 1,000 characters or fewer.': 'ব্যাখ্যা 1,000 অক্ষর বা তার কম হতে হবে।',
    'Message must be at least 10 characters.': 'বার্তা কমপক্ষে 10 অক্ষরের হতে হবে।',
    'Message must be 2,000 characters or fewer.': 'বার্তা 2,000 অক্ষর বা তার কম হতে হবে।',
    'Subject must be at least 3 characters.': 'বিষয় কমপক্ষে 3 অক্ষরের হতে হবে।',
    'Subject must be 100 characters or fewer.': 'বিষয় 100 অক্ষর বা তার কম হতে হবে।',
    'Link must be 500 characters or fewer.': 'লিংক 500 অক্ষর বা তার কম হতে হবে।',
    'Reference must be 120 characters or fewer.': 'রেফারেন্স 120 অক্ষর বা তার কম হতে হবে।',
    'No notifications yet': 'এখনও কোনো নোটিফিকেশন নেই',
    'Updates about your registrations, matches, results and announcements will appear here.': 'আপনার নিবন্ধন, ম্যাচ, ফলাফল ও ঘোষণার আপডেট এখানে দেখা যাবে।',

    /* marketplace */
    'Add to cart': 'কার্টে যোগ করুন',
    'View cart': 'কার্ট দেখুন',
    'Browse products': 'পণ্য দেখুন',
    'Proceed to checkout': 'চেকআউটে যান',
    'Place COD order': 'ক্যাশ অন ডেলিভারি অর্ডার দিন',
    'Remove': 'সরান',
    'Loading products…': 'পণ্য লোড হচ্ছে…',
    'Loading product…': 'পণ্য লোড হচ্ছে…',
    'Loading your orders…': 'আপনার অর্ডার লোড হচ্ছে…',
    'Checking prices and stock…': 'দাম ও স্টক যাচাই হচ্ছে…',
    'Placing order…': 'অর্ডার দেওয়া হচ্ছে…',
    'Updating your cart…': 'আপনার কার্ট আপডেট হচ্ছে…',
    'Entering Marketplace…': 'মার্কেটপ্লেসে প্রবেশ করা হচ্ছে…',
    'Returning to Gaming…': 'গেমিংয়ে ফেরা হচ্ছে…',
    'Could not load products': 'পণ্য লোড করা যায়নি',
    'Could not load this product': 'এই পণ্য লোড করা যায়নি',
    'Could not load your orders': 'আপনার অর্ডার লোড করা যায়নি',
    'Could not update your cart': 'আপনার কার্ট আপডেট করা যায়নি',
    'Could not verify your cart': 'আপনার কার্ট যাচাই করা যায়নি',
    'Could not open the Marketplace. You can try again or stay where you are.': 'মার্কেটপ্লেস খোলা যায়নি। আবার চেষ্টা করুন বা এখানেই থাকুন।',
    'Could not return to Gaming. You can try again or stay where you are.': 'গেমিংয়ে ফেরা যায়নি। আবার চেষ্টা করুন বা এখানেই থাকুন।',
    'Could not save this change in your browser. Check your browser storage settings and try again.': 'এই পরিবর্তন ব্রাউজারে সংরক্ষণ করা যায়নি। ব্রাউজারের স্টোরেজ সেটিং দেখে আবার চেষ্টা করুন।',
    'Could not verify prices and stock. Nothing was ordered. Please try again.': 'দাম ও স্টক যাচাই করা যায়নি। কিছু অর্ডার হয়নি। আবার চেষ্টা করুন।',
    'Your cart is empty': 'আপনার কার্ট খালি',
    'Add products from the Marketplace and they will appear here.': 'মার্কেটপ্লেস থেকে পণ্য যোগ করুন, সেগুলো এখানে দেখা যাবে।',
    'Add products first, then come back to checkout.': 'আগে পণ্য যোগ করুন, তারপর চেকআউটে ফিরে আসুন।',
    'No orders yet': 'এখনও কোনো অর্ডার নেই',
    'No products yet': 'এখনও কোনো পণ্য নেই',
    'No products are available right now. Please check back soon.': 'এখন কোনো পণ্য নেই। শীঘ্রই আবার দেখুন।',
    'No matching products': 'কোনো মিল পাওয়া যায়নি',
    'Try a different search or category.': 'অন্য কিছু খুঁজুন বা অন্য ক্যাটাগরি বেছে নিন।',
    'Clear search and filters': 'সার্চ ও ফিল্টার মুছুন',
    'Reset filters': 'ফিল্টার রিসেট করুন',
    'Show results': 'ফলাফল দেখান',
    'Product not found': 'পণ্য পাওয়া যায়নি',
    'This product does not exist or is no longer available.': 'এই পণ্যটি নেই বা আর পাওয়া যায় না।',
    'All products': 'সব পণ্য',
    'All brands': 'সব ব্র্যান্ড',
    'All subcategories': 'সব উপ-ক্যাটাগরি',
    'Any condition': 'যেকোনো অবস্থা',
    'In stock only': 'শুধু স্টকে আছে',
    'In stock': 'স্টকে আছে',
    'Out of stock': 'স্টক শেষ',
    'Out of stock.': 'স্টক শেষ।',
    'Limited Stock': 'সীমিত স্টক',
    'Availability unknown': 'প্রাপ্যতা অজানা',
    'Availability unknown.': 'প্রাপ্যতা অজানা।',
    'Price unavailable': 'দাম পাওয়া যায়নি',
    'Price unavailable.': 'দাম পাওয়া যায়নি।',
    'Min price': 'সর্বনিম্ন দাম',
    'Max price': 'সর্বোচ্চ দাম',
    'Newest first': 'সবচেয়ে নতুন আগে',
    'Recommended': 'প্রস্তাবিত',
    'Name: A–Z': 'নাম: A–Z',
    'Price: Low to High': 'দাম: কম থেকে বেশি',
    'Price: High to Low': 'দাম: বেশি থেকে কম',
    'Best Seller': 'বেস্ট সেলার',
    'New Arrival': 'নতুন আগমন',
    'Discounted': 'ছাড়ে',
    'Specifications': 'বৈশিষ্ট্য',
    'Package contents': 'প্যাকেজের উপকরণ',
    'Additional information': 'অতিরিক্ত তথ্য',
    'Warranty': 'ওয়ারেন্টি',
    'Return policy': 'রিটার্ন নীতি',
    'Country of origin': 'উৎপত্তির দেশ',
    'Condition': 'অবস্থা',
    'Items': 'আইটেম',
    'Subtotal': 'সাবটোটাল',
    'Product subtotal': 'পণ্যের সাবটোটাল',
    'Delivery fee': 'ডেলিভারি ফি',
    'Total': 'মোট',
    'Estimated delivery': 'আনুমানিক ডেলিভারি',
    'Shipping and payment are not calculated yet.': 'শিপিং ও পেমেন্ট এখনও হিসাব করা হয়নি।',
    'Unavailable product': 'অনুপলব্ধ পণ্য',
    'This product is not available.': 'এই পণ্যটি পাওয়া যাচ্ছে না।',
    'This product is out of stock.': 'এই পণ্যের স্টক শেষ।',
    'This option is unavailable.': 'এই অপশনটি পাওয়া যাচ্ছে না।',
    'This option is no longer available.': 'এই অপশনটি আর পাওয়া যায় না।',
    'This combination is not available.': 'এই সমন্বয়টি পাওয়া যাচ্ছে না।',
    'Quantity updated.': 'পরিমাণ আপডেট হয়েছে।',
    'No longer available. Remove it to continue.': 'আর পাওয়া যায় না। চালিয়ে যেতে এটি সরান।',
    'This option is unavailable. Remove it to continue.': 'এই অপশনটি পাওয়া যাচ্ছে না। চালিয়ে যেতে এটি সরান।',
    'This product cannot be added because its availability is unknown.': 'প্রাপ্যতা অজানা হওয়ায় এই পণ্য যোগ করা যাচ্ছে না।',
    'This product cannot be added because its price is unavailable.': 'দাম পাওয়া না যাওয়ায় এই পণ্য যোগ করা যাচ্ছে না।',
    'This product now has options and needs a choice.': 'এই পণ্যে এখন অপশন আছে, একটি বেছে নিতে হবে।',
    'The quantity cannot be increased because availability is not confirmed.': 'প্রাপ্যতা নিশ্চিত নয় বলে পরিমাণ বাড়ানো যাচ্ছে না।',
    'A product price is not valid.': 'একটি পণ্যের দাম সঠিক নয়।',
    'A quantity in your cart is not valid.': 'আপনার কার্টের একটি পরিমাণ সঠিক নয়।',
    'Your browser is not saving the cart.': 'আপনার ব্রাউজার কার্ট সংরক্ষণ করছে না।',
    'Your browser is not saving the cart. It will be lost when you leave or refresh this page.': 'আপনার ব্রাউজার কার্ট সংরক্ষণ করছে না। পেজ ছাড়লে বা রিফ্রেশ করলে এটি হারিয়ে যাবে।',
    'Your cart has products in different currencies. Mixed-currency orders are not supported, so please order them separately.': 'আপনার কার্টে ভিন্ন ভিন্ন মুদ্রার পণ্য আছে। মিশ্র মুদ্রার অর্ডার সমর্থিত নয়, তাই আলাদাভাবে অর্ডার করুন।',
    'These products use different currencies, so totals are shown separately and are not added together.': 'এই পণ্যগুলোর মুদ্রা ভিন্ন, তাই মোট আলাদাভাবে দেখানো হয়েছে এবং যোগ করা হয়নি।',
    'Fix cart items to continue': 'চালিয়ে যেতে কার্টের আইটেম ঠিক করুন',
    'Checkout is blocked': 'চেকআউট আটকে আছে',
    'Checkout is not available for this cart': 'এই কার্টের জন্য চেকআউট পাওয়া যাচ্ছে না',
    'Some items cannot be ordered. Nothing was removed from your cart and no partial order will be placed. Fix the items in your cart to continue.': 'কিছু আইটেম অর্ডার করা যাবে না। আপনার কার্ট থেকে কিছু সরানো হয়নি এবং আংশিক অর্ডার দেওয়া হবে না। চালিয়ে যেতে কার্টের আইটেম ঠিক করুন।',
    'Cash on Delivery': 'ক্যাশ অন ডেলিভারি',
    'Cash on Delivery only. Prices and stock are checked again at checkout.': 'শুধু ক্যাশ অন ডেলিভারি। চেকআউটে দাম ও স্টক আবার যাচাই করা হয়।',
    'Cash on Delivery only. We do not ask for card details or passwords.': 'শুধু ক্যাশ অন ডেলিভারি। আমরা কার্ডের তথ্য বা পাসওয়ার্ড চাই না।',
    'Cash on Delivery. Add to cart, then check out from your cart.': 'ক্যাশ অন ডেলিভারি। কার্টে যোগ করুন, তারপর কার্ট থেকে চেকআউট করুন।',
    'Payment method': 'পেমেন্ট পদ্ধতি',
    'Payment method: Cash on Delivery. Payment is due upon delivery.': 'পেমেন্ট পদ্ধতি: ক্যাশ অন ডেলিভারি। ডেলিভারির সময় মূল্য পরিশোধ করতে হবে।',
    'Payment status': 'পেমেন্টের অবস্থা',
    'Payment unverified': 'পেমেন্ট যাচাই হয়নি',
    'Payment verified': 'পেমেন্ট যাচাই হয়েছে',
    'Payment rejected': 'পেমেন্ট প্রত্যাখ্যাত',
    'No payment was taken on this site and none is verified here.': 'এই সাইটে কোনো পেমেন্ট নেওয়া হয়নি এবং এখানে কিছু যাচাইও হয়নি।',
    'Order summary': 'অর্ডারের সারসংক্ষেপ',
    'Order confirmed': 'অর্ডার নিশ্চিত হয়েছে',
    'Order date': 'অর্ডারের তারিখ',
    'Order reference': 'অর্ডার রেফারেন্স',
    'Order status': 'অর্ডারের অবস্থা',
    'Order status: Pending Confirmation': 'অর্ডারের অবস্থা: নিশ্চিতকরণের অপেক্ষায়',
    'Pending Confirmation': 'নিশ্চিতকরণের অপেক্ষায়',
    'Thank you. Your order was received.': 'ধন্যবাদ। আপনার অর্ডার গ্রহণ করা হয়েছে।',
    'A human agent will contact you to confirm your order. Stock is not reserved or guaranteed until then.': 'অর্ডার নিশ্চিত করতে একজন প্রতিনিধি আপনার সঙ্গে যোগাযোগ করবেন। তার আগে স্টক সংরক্ষিত বা নিশ্চিত নয়।',
    'Your order is sent to ZEGGO as Cash on Delivery. A human agent will contact you to confirm it. Stock is not reserved by placing the order.': 'আপনার অর্ডার ক্যাশ অন ডেলিভারি হিসেবে ZEGGO-তে পাঠানো হয়েছে। নিশ্চিত করতে একজন প্রতিনিধি যোগাযোগ করবেন। অর্ডার দিলেই স্টক সংরক্ষিত হয় না।',
    'You ordered as a guest. Keep this reference: guest orders do not appear under "Orders". Contact ZEGGO support with it to check your order.': 'আপনি অতিথি হিসেবে অর্ডার করেছেন। এই রেফারেন্সটি সংরক্ষণ করুন: অতিথি অর্ডার “অর্ডার” বিভাগে দেখা যায় না। অর্ডার যাচাই করতে এটি দিয়ে ZEGGO সাপোর্টে যোগাযোগ করুন।',
    'Order placement is not available yet. Checking your details does not order, charge or reserve anything.': 'অর্ডার দেওয়ার সুবিধা এখনও চালু হয়নি। তথ্য যাচাই করলে কিছু অর্ডার, চার্জ বা সংরক্ষণ হয় না।',
    'Your details look valid, but online order placement is not available yet. Nothing was ordered, charged or reserved. Your cart and details were kept.': 'আপনার তথ্য সঠিক মনে হচ্ছে, কিন্তু অনলাইনে অর্ডার দেওয়ার সুবিধা এখনও চালু হয়নি। কিছু অর্ডার, চার্জ বা সংরক্ষণ হয়নি। আপনার কার্ট ও তথ্য রাখা হয়েছে।',
    'The order was not accepted. Nothing was ordered. Your cart and details were kept.': 'অর্ডার গ্রহণ করা হয়নি। কিছু অর্ডার হয়নি। আপনার কার্ট ও তথ্য রাখা হয়েছে।',
    'Prices and stock could not be checked. Check your connection and try again.': 'দাম ও স্টক যাচাই করা যায়নি। সংযোগ দেখে আবার চেষ্টা করুন।',
    'Prices or stock changed while you were checking out. Nothing was ordered. Please review the updated order.': 'চেকআউটের সময় দাম বা স্টক বদলেছে। কিছু অর্ডার হয়নি। আপডেট হওয়া অর্ডারটি দেখে নিন।',
    'Prices or stock changed, or an item became unavailable. Nothing was ordered. Please review the updated order.': 'দাম বা স্টক বদলেছে, অথবা কোনো আইটেম পাওয়া যাচ্ছে না। কিছু অর্ডার হয়নি। আপডেট হওয়া অর্ডারটি দেখে নিন।',
    'We could not check your account status right now, so your order was not placed. Nothing was ordered or charged. Please try again in a moment.': 'এখন আপনার অ্যাকাউন্টের অবস্থা যাচাই করা যায়নি, তাই অর্ডার দেওয়া হয়নি। কিছু অর্ডার বা চার্জ হয়নি। একটু পরে আবার চেষ্টা করুন।',
    'Your marketplace access is currently restricted, so this order could not be placed. Nothing was ordered or charged. Please contact ZEGGO support for a review.': 'আপনার মার্কেটপ্লেস অ্যাক্সেস বর্তমানে সীমিত, তাই এই অর্ডার দেওয়া যায়নি। কিছু অর্ডার বা চার্জ হয়নি। পর্যালোচনার জন্য ZEGGO সাপোর্টে যোগাযোগ করুন।',

    /* delivery form */
    'Delivery details': 'ডেলিভারির তথ্য',
    'Delivery address': 'ডেলিভারির ঠিকানা',
    'Delivery instructions (optional)': 'ডেলিভারি নির্দেশনা (ঐচ্ছিক)',
    'Mobile number': 'মোবাইল নম্বর',
    'Your email address': 'আপনার ইমেইল ঠিকানা',
    'Division': 'বিভাগ',
    'District': 'জেলা',
    'Upazila / Thana': 'উপজেলা / থানা',
    'Union / Ward': 'ইউনিয়ন / ওয়ার্ড',
    'Village / Area': 'গ্রাম / এলাকা',
    'Select the division.': 'বিভাগ বেছে নিন।',
    'Enter your full name (2 to 60 characters).': 'আপনার পূর্ণ নাম লিখুন (2 থেকে 60 অক্ষর)।',
    'Enter your mobile number.': 'আপনার মোবাইল নম্বর লিখুন।',
    'Enter a valid Bangladesh mobile number, for example 01XXXXXXXXX or +8801XXXXXXXXX.': 'একটি সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন, যেমন 01XXXXXXXXX বা +8801XXXXXXXXX।',
    'Enter your full delivery address (at least 10 characters).': 'আপনার পূর্ণ ডেলিভারি ঠিকানা লিখুন (কমপক্ষে 10 অক্ষর)।',
    'Dhaka': 'ঢাকা',
    'Chattogram': 'চট্টগ্রাম',
    'Khulna': 'খুলনা',
    'Rajshahi': 'রাজশাহী',
    'Barishal': 'বরিশাল',
    'Sylhet': 'সিলেট',
    'Rangpur': 'রংপুর',
    'Mymensingh': 'ময়মনসিংহ',
    'Please fix the highlighted fields': 'অনুগ্রহ করে চিহ্নিত ঘরগুলো সংশোধন করুন',

    /* notifications / misc */
    'Open ZEGGO for your match details.': 'ম্যাচের বিস্তারিত দেখতে ZEGGO খুলুন।',
    'Maintenance': 'রক্ষণাবেক্ষণ',
    'Important': 'গুরুত্বপূর্ণ',
    'Personal': 'ব্যক্তিগত'
  });

  /* labels used by the "Select …" / "Enter …" patterns below */
  var LBL = {
    'division': 'বিভাগ', 'district': 'জেলা', 'upazila or thana': 'উপজেলা / থানা',
    'union or ward': 'ইউনিয়ন / ওয়ার্ড', 'village or area': 'গ্রাম / এলাকা',
    'full name': 'পূর্ণ নাম', 'in-game name': 'ইন-গেম নাম', 'in-game nickname': 'ইন-গেম ডাকনাম'
  };
  var WHO = { 'your': 'আপনার', 'the teammate\u2019s': 'সতীর্থের', "the teammate's": 'সতীর্থের' };

  /* ------------------------------------------------------------------ *
   * 3. PATTERN RULES — strings that contain numbers or names
   *    (digits and tournament/product names are kept exactly as they are)
   * ------------------------------------------------------------------ */
  function pat(re, fn) { P.push([re, fn]); }
  function T(s) { var t = tr(s); return t == null ? s : t; }

  pat(/^Showing (\d+) tournaments?\.$/, function (m) { return m[1] + 'টি টুর্নামেন্ট দেখানো হচ্ছে।'; });
  pat(/^No (free|paid)-entry tournaments are published right now\.$/, function (m) { return 'এখন কোনো ' + (m[1] === 'free' ? 'ফ্রি' : 'পেইড') + '-এন্ট্রি টুর্নামেন্ট প্রকাশিত নেই।'; });
  pat(/^(\d+) products?$/, function (m) { return m[1] + 'টি পণ্য'; });
  pat(/^Showing (\d+) of (\d+) products$/, function (m) { return m[2] + 'টি পণ্যের মধ্যে ' + m[1] + 'টি দেখানো হচ্ছে'; });
  pat(/^Showing (\d+) questions?\.$/, function (m) { return m[1] + 'টি প্রশ্ন দেখানো হচ্ছে।'; });
  pat(/^Showing (\d+) of (\d+) published matches?\.$/, function (m) { return m[2] + 'টি প্রকাশিত ম্যাচের মধ্যে ' + m[1] + 'টি দেখানো হচ্ছে।'; });
  pat(/^Only (\d+) left$/, function (m) { return 'মাত্র ' + m[1] + 'টি বাকি'; });
  pat(/^You save (.+)$/, function (m) { return 'আপনি সাশ্রয় করছেন ' + m[1]; });
  pat(/^Show image (\d+) of (\d+)$/, function (m) { return 'ছবি ' + m[1] + '/' + m[2] + ' দেখান'; });
  pat(/^Cart, (\d+) items?$/, function (m) { return 'কার্ট, ' + m[1] + 'টি আইটেম'; });
  pat(/^Notifications, (\d+) unread$/, function (m) { return 'নোটিফিকেশন, ' + m[1] + 'টি অপঠিত'; });
  pat(/^(\d+) unread of (\d+)$/, function (m) { return m[2] + 'টির মধ্যে ' + m[1] + 'টি অপঠিত'; });
  pat(/^All (\d+) read$/, function (m) { return 'সব ' + m[1] + 'টি পঠিত'; });
  pat(/^Quantity (\d+)$/, function (m) { return 'পরিমাণ ' + m[1]; });
  pat(/^Qty (\S+) \u00d7 (.+) = (.+)$/, function (m) { return 'পরিমাণ ' + m[1] + ' × ' + m[2] + ' = ' + m[3]; });
  pat(/^Added to cart\. You have (\d+) in your cart\.( Your browser is not saving the cart, so it will be lost when you leave this page\.)?$/, function (m) {
    return 'কার্টে যোগ হয়েছে। আপনার কার্টে এখন ' + m[1] + 'টি আছে।' + (m[2] ? ' আপনার ব্রাউজার কার্ট সংরক্ষণ করছে না, তাই পেজ ছাড়লে এটি হারিয়ে যাবে।' : '');
  });
  pat(/^Only (\d+) available, and you already have (\d+) in your cart\.$/, function (m) { return 'মাত্র ' + m[1] + 'টি পাওয়া যাচ্ছে, এবং আপনার কার্টে ইতিমধ্যে ' + m[2] + 'টি আছে।'; });
  pat(/^Only (\d+) available\. Reduce the quantity to continue\.$/, function (m) { return 'মাত্র ' + m[1] + 'টি পাওয়া যাচ্ছে। চালিয়ে যেতে পরিমাণ কমান।'; });
  pat(/^Only (\d+) available\. You cannot add more\.$/, function (m) { return 'মাত্র ' + m[1] + 'টি পাওয়া যাচ্ছে। আর যোগ করা যাবে না।'; });
  pat(/^Price changed from (.+) to (.+)\.$/, function (m) { return 'দাম ' + m[1] + ' থেকে বদলে ' + m[2] + ' হয়েছে।'; });
  pat(/^Stock for (.+) is not valid or too low\.$/, function (m) { return m[1] + '-এর স্টক সঠিক নয় বা খুব কম।'; });
  pat(/^Please fix (\d+) fields?:$/, function (m) { return 'অনুগ্রহ করে ' + m[1] + 'টি ঘর সংশোধন করুন:'; });
  pat(/^Select (.+) to see price and availability\.$/, function (m) { return 'দাম ও প্রাপ্যতা দেখতে ' + m[1].split(', ').map(function (x) { return LBL[x.toLowerCase()] || x; }).join(', ') + ' বেছে নিন।'; });
  pat(/^Select (division|district|upazila or thana|union or ward|village or area)$/, function (m) { return LBL[m[1]] + ' বেছে নিন'; });
  pat(/^Register for (.+)$/, function (m) { return 'নিবন্ধন করুন: ' + m[1]; });
  pat(/^Registered \u00b7 (.+)$/, function (m) { return 'নিবন্ধিত · ' + T(m[1]); });
  pat(/^(Send again|Resend) in (\d+)s$/, function (m) { return 'আবার পাঠাতে ' + m[2] + ' সেকেন্ড অপেক্ষা করুন'; });
  pat(/^Your registration for (.+) was approved\.$/, function (m) { return 'আপনার ' + m[1] + '-এর নিবন্ধন অনুমোদিত হয়েছে।'; });
  pat(/^Your registration for (.+) was not approved\. Check the Tournaments page for details\.$/, function (m) { return 'আপনার ' + m[1] + '-এর নিবন্ধন অনুমোদিত হয়নি। বিস্তারিত জানতে টুর্নামেন্ট পেজ দেখুন।'; });
  pat(/^Your registration for (.+) was cancelled\.$/, function (m) { return 'আপনার ' + m[1] + '-এর নিবন্ধন বাতিল করা হয়েছে।'; });
  pat(/^(.+) was cancelled\.( Reason: .+)? Status: Cancelled\.$/, function (m) { return m[1] + ' বাতিল করা হয়েছে।' + (m[2] ? ' কারণ: ' + m[2].slice(9) : '') + ' অবস্থা: বাতিল।'; });
  pat(/^Player (\d+)(?: \u2014 (Team Leader|Teammate))?$/, function (m) { return 'খেলোয়াড় ' + m[1] + (m[2] ? ' — ' + (m[2] === 'Team Leader' ? 'টিম লিডার' : 'সতীর্থ') : ''); });
  pat(/^Enter (your|the teammate\u2019s|the teammate's) (full name|in-game name|in-game nickname) \(2 to (\d+) characters\)\.$/, function (m) { return WHO[m[1]] + ' ' + LBL[m[2]] + ' লিখুন (2 থেকে ' + m[3] + ' অক্ষর)।'; });
  pat(/^Enter (your|the teammate\u2019s|the teammate's) Free Fire UID: 6 to 15 digits, numbers only\.$/, function (m) { return WHO[m[1]] + ' Free Fire UID লিখুন: 6 থেকে 15 অঙ্ক, শুধু সংখ্যা।'; });
  pat(/^Enter (your|the teammate\u2019s|the teammate's) valid email address\.$/, function (m) { return WHO[m[1]] + ' একটি সঠিক ইমেইল ঠিকানা লিখুন।'; });
  pat(/^Watch (.+) \(opens in a new tab\)$/, function (m) { return m[1] + ' দেখুন (নতুন ট্যাবে খুলবে)'; });
  pat(/^Play (.+)$/, function (m) { return m[1] + ' চালান'; });
  pat(/^Round: (.+)$/, function (m) { return 'রাউন্ড: ' + m[1]; });
  pat(/^Tournament: (.+)$/, function (m) { return 'টুর্নামেন্ট: ' + m[1]; });
  pat(/^(.+) is not available yet\.$/, function (m) { return T(m[1]) + ' এখনও পাওয়া যাচ্ছে না।'; });

  /* ------------------------------------------------------------------ *
   * 4. ENGINE
   * ------------------------------------------------------------------ */
  function tr1(s) {
    if (D[s] !== undefined) return D[s];
    for (var i = 0; i < P.length; i++) { var m = P[i][0].exec(s); if (m) return P[i][1](m); }
    return null;
  }
  function tr(s) {
    var out = tr1(s);
    if (out != null) return out;
    /* page titles like "Tournaments — ZEGGO": translate each segment */
    if (s.indexOf(' \u2014 ') > -1) {
      var parts = s.split(' \u2014 '), hit = false;
      var mapped = parts.map(function (p) { var t = tr1(p); if (t != null) { hit = true; return t; } return p; });
      if (hit) return mapped.join(' \u2014 ');
    }
    return null;
  }
  function reverse(s) {
    if (!RD) { RD = Object.create(null); for (var k in D) if (!(D[k] in RD)) RD[D[k]] = k; }
    return RD[s];
  }
  function noteMissing(key) {
    if (!/[A-Za-z]{3,}/.test(key) || api.missing[key]) return;
    api.missing[key] = 1;
    if (api.debug && window.console) console.warn('[ZEGGO i18n] missing Bengali for:', key);
  }

  function doText(node) {
    var cur = node.nodeValue, rec = tmap.get(node);
    if (lang === 'bn') {
      if (rec && cur === rec.bn) return; /* already translated by us */
      var core = cur.trim();
      if (!core) return;
      var key = core.replace(/\s+/g, ' ');
      var out = tr(key);
      if (out == null) { tmap.delete(node); noteMissing(key); return; }
      var lead = cur.match(/^\s*/)[0], trail = cur.match(/\s*$/)[0], val = lead + out + trail;
      tmap.set(node, { en: cur, bn: val });
      node.nodeValue = val;
    } else {
      if (rec) { if (cur === rec.bn) node.nodeValue = rec.en; tmap.delete(node); return; }
      var back = reverse(cur.trim()); /* safety net: app re-wrote a Bengali string it had read back */
      if (back !== undefined) node.nodeValue = cur.replace(cur.trim(), back);
    }
  }
  function doAttr(el, name) {
    if (!el.hasAttribute(name)) return;
    var cur = el.getAttribute(name), rec = amap.get(el), r = rec && rec[name];
    if (lang === 'bn') {
      if (r && cur === r.bn) return;
      var key = cur.trim().replace(/\s+/g, ' ');
      if (!key) return;
      var out = tr(key);
      if (out == null) { if (r) delete rec[name]; noteMissing(key); return; }
      if (!rec) { rec = {}; amap.set(el, rec); }
      rec[name] = { en: cur, bn: out };
      el.setAttribute(name, out);
    } else if (r) {
      if (cur === r.bn) el.setAttribute(name, r.en);
      delete rec[name];
    }
  }
  function doAttrs(el) { for (var i = 0; i < ATTRS.length; i++) doAttr(el, ATTRS[i]); }
  function skipEl(el) {
    return !!SKIP[el.tagName] || el.hasAttribute('data-i18n-skip') || el.getAttribute('translate') === 'no';
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!(root.parentNode && root.parentNode.nodeType === 1 && (skipEl(root.parentNode) || root.parentNode.closest('[data-i18n-skip],[translate="no"]')))) doText(root); return; }
    if (root.nodeType === 1) {
      if (skipEl(root) || (root.closest && root.closest('[data-i18n-skip],[translate="no"]'))) return;
      doAttrs(root);
    } else if (root.nodeType !== 9 && root.nodeType !== 11) return;
    var tw = document.createTreeWalker(root, 1 | 4, {
      acceptNode: function (n) { return n.nodeType === 1 && skipEl(n) ? 2 : 1; }
    });
    var n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }

  function onMutations(list) {
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.type === 'childList') { for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]); }
      else if (r.type === 'characterData') walk(r.target);
      else if (r.type === 'attributes') doAttr(r.target, r.attributeName);
    }
    obs.takeRecords(); /* drop mutations caused by our own writes */
  }
  function startObserver() {
    if (obs || !window.MutationObserver) return;
    obs = new MutationObserver(onMutations);
    obs.observe(document.documentElement, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ATTRS });
  }
  function stopObserver() { if (obs) { obs.disconnect(); obs = null; } }

  function syncSwitchers() {
    var toBn = lang !== 'bn';
    document.querySelectorAll('[data-lang-switch]').forEach(function (b) {
      b.textContent = toBn ? 'বাংলা' : 'English';
      b.setAttribute('data-show', toBn ? 'bn' : 'en');
      b.setAttribute('lang', toBn ? 'bn' : 'en');
      b.setAttribute('aria-label', toBn ? 'Switch language to Bengali' : 'ভাষা ইংরেজিতে পরিবর্তন করুন');
      b.setAttribute('title', toBn ? 'বাংলা' : 'English');
    });
  }

  function setLang(l, persist) {
    l = l === 'bn' ? 'bn' : 'en';
    stopObserver();
    lang = api.lang = l;
    var root = document.documentElement;
    root.setAttribute('lang', l);
    root.setAttribute('data-lang', l);
    if (persist !== false) { try { window.localStorage.setItem(KEY, l); } catch (e) { /* storage blocked: still works for this visit */ } }
    walk(root);
    syncSwitchers();
    if (l === 'bn') startObserver();
    document.dispatchEvent(new CustomEvent('zeggo:language-changed', { detail: { lang: l } }));
  }

  var api = window.ZEGGO_I18N = {
    lang: 'en',
    missing: {},
    debug: /[?&]i18n=debug\b/.test(location.search),
    set: setLang,
    t: function (s) { return lang === 'bn' ? (tr(s) == null ? s : tr(s)) : s; },
    report: function () { return Object.keys(api.missing); }
  };

  /* one delegated listener serves every [data-lang-switch] button (gaming + marketplace headers) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang-switch]');
    if (b) setLang(lang === 'bn' ? 'en' : 'bn');
  });

  var saved = null;
  try { saved = window.localStorage.getItem(KEY); } catch (e) { saved = null; }
  setLang(saved === 'bn' ? 'bn' : 'en', false);
})();
