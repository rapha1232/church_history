
/* Edition 24: Authenticity labels. Each entry says what is known about a work's authorship and date, with the
   evidence and its sources. Shown on the Early Christian texts pages and on matching Church Father items in
   Studies. Kinds: genuine · debated (genuine but with a live scholarly question) · disputed · spurious. */
(function(){
"use strict";
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

var KIND = {genuine: "Genuine", debated: "Genuine, with open questions", disputed: "Disputed", spurious: "Not authentic"};
var BMCR = {t: "Bryn Mawr Classical Review 2020.10.39 (on the Ignatius debate)", u: "https://bmcr.brynmawr.edu/?p=49314"};
var LIGHTFOOT = {t: "J. B. Lightfoot, The Apostolic Fathers, Part II: S. Ignatius, S. Polycarp (1885); English translations ed. J. R. Harmer (1891)", u: "https://www.ccel.org/ccel/lightfoot/fathers"};

var A = {
 "1clem": {kind: "genuine", label: "Genuine early letter; author by tradition",
   text: "An unsigned letter from the church of Rome to the church of Corinth. From Dionysius of Corinth (c. 170, quoted by Eusebius, Church History 4.23) onward it was ascribed to Clement, bishop of Rome. Its early date is not in doubt; it is usually dated c. 95–96, though some scholars place it earlier or later.",
   src: [{t: "Eusebius, Church History 4.23 (Dionysius of Corinth)"}, {t: "Dictionary of Christian Biography (1911), “Clemens Romanus”", u: "https://en.wikisource.org/wiki/Dictionary_of_Christian_Biography_and_Literature_to_the_End_of_the_Sixth_Century/Clemens_Romanus"}]},
 "ign7": {kind: "debated", label: "Genuine (majority view); a minority disputes it",
   text: "These are the seven letters of the “middle recension”. Since Theodor Zahn (1873) and J. B. Lightfoot (1885) most scholars have accepted them as Ignatius’ own. A minority, notably R. M. Hübner (1997) and T. Lechner (1999), argue that they were written later, around 170, under Ignatius’ name. Their exact date is also debated. Do not confuse them with the longer, interpolated letters, which are later.",
   src: [LIGHTFOOT, BMCR, {t: "T. Lechner, Ignatius adversus Valentinianos? (1999); R. M. Hübner, “Thesen zur Echtheit und Datierung der sieben Briefe des Ignatius von Antiochien”, ZAC 1 (1997)"}]},
 "ignlong": {kind: "spurious", label: "Not by Ignatius: later expansion",
   text: "Besides the seven genuine letters there is a longer, interpolated form of them and further letters under Ignatius’ name (to the Tarsians, Antiochians, Philippians, Hero, Mary of Cassobola, the Virgin Mary and St John). These are later compositions, usually dated to the 4th century; the Ante-Nicene Fathers prints the extra letters under the heading “Spurious Epistles”. A quotation from them is not evidence for the beliefs of the early 2nd century.",
   src: [LIGHTFOOT, {t: "Ante-Nicene Fathers, vol. 1: “The Spurious Epistles of Ignatius”", u: "https://www.ccel.org/ccel/schaff/anf01.v.xiii.html"}]},
 "pol-phil": {kind: "debated", label: "Genuine; perhaps two letters joined",
   text: "Accepted as Polycarp’s. P. N. Harrison (1936) argued that it joins two letters: chapter 13 (and perhaps 14), a covering note sent with Ignatius’ letters soon after his death, and chapters 1–12, written some twenty years later. The theory is widely discussed but not accepted by everyone.",
   src: [{t: "P. N. Harrison, Polycarp’s Two Epistles to the Philippians (Cambridge, 1936)", u: "https://www.cambridge.org/core/journals/church-history/article/polycarps-two-epistles-to-the-philippians-by-p-n-harrison-cambridge-at-the-university-press-new-york-the-macmillan-co-1936-xii-356-pages-750/EA81474F663B756C6A0A81CB1296462A"}]},
 "mart-pol": {kind: "debated", label: "Early account; dating debated",
   text: "A letter of the church of Smyrna, usually dated soon after Polycarp’s death (c. 155–160). Candida Moss (2010) argues that it was written much later, in the 3rd century; others reject her case. The text also grew: the Oxford Cult of Saints database treats the dating note (ch. 21) as a 3rd–4th-century addition, and ch. 22 ends with notes by later copyists (Gaius, Socrates or Isocrates, Pionius) on how the text was passed down.",
   src: [{t: "C. R. Moss, “On the Dating of Polycarp”, Early Christianity 1 (2010), 539–574", u: "https://muse.jhu.edu/article/521822"}, {t: "The Cult of Saints in Late Antiquity, E00056", u: "https://portal.sds.ox.ac.uk/articles/online_resource/E00056_3rd_4th_century_addition_to_the_2nd_or_3rd_century_Greek_Martyrdom_of_Polycarp_Polykarpos_bishop_and_martyr_of_Smyrna_S00004_indicates_23_February_as_the_date_of_the_saint_s_martyrdom_Written_in_Smyrna_western_Asia_Minor_/13795289"}]},
 "didache": {kind: "debated", label: "Genuine early text; anonymous, date debated",
   text: "Its title names the Twelve Apostles, but the Didache is an anonymous church manual put together by an unknown editor from earlier material. Proposed dates range from c. 70 (J.-P. Audet) to c. 110–120 (K. Niederwimmer).",
   src: [{t: "K. Niederwimmer, The Didache, Hermeneia (Fortress, 1998)", u: "https://www.thegospelcoalition.org/themelios/review/the-didache/"}]},
 "justin-1apol": {kind: "genuine", label: "Genuine",
   text: "Justin’s own work, addressed to the Emperor Antoninus Pius and his sons (ch. 1). Justin dates it himself, saying Christ was born “one hundred and fifty years ago” (ch. 46), so c. 150–155. The three imperial letters printed after it are a separate matter (see each).",
   src: [{t: "D. Minns and P. Parvis, Justin, Philosopher and Martyr: Apologies (Oxford Early Christian Texts, 2009)"}]},
 "justin-app1": {kind: "debated", label: "Probably genuine (debated)",
   text: "Justin says he is attaching Hadrian’s letter (1 Apol. 68). Its authenticity has been doubted (e.g. H. Nesselhauf), but Justin’s most recent editors, D. Minns and P. Parvis (2009), treat it as genuine. The Greek text in the manuscripts seems to be Eusebius’ translation of the Latin original.",
   src: [{t: "D. Minns and P. Parvis, Justin, Philosopher and Martyr: Apologies (2009), p. 44"}]},
 "justin-app2": {kind: "spurious", label: "Not authentic as it stands",
   text: "This “edict” in Christians’ favour contradicts what is known of their legal position in the 2nd century, and the copy in Eusebius (Church History 4.13) bears Marcus Aurelius’ name instead. Most scholars regard it as a Christian fabrication or reworking; A. von Harnack and, more recently, C. P. Jones (2018) argue that a genuine imperial letter lies behind it.",
   src: [{t: "C. P. Jones, “A Letter of Antoninus Pius and an Antonine Rescript concerning Christians”, GRBS (2018)", u: "https://grbs.library.duke.edu/index.php/grbs/article/view/16015"}, {t: "A. C. McGiffert, notes to Eusebius, Church History 4.13 (NPNF II/1, 1890)", u: "https://ccel.org/ccel/schaff/npnf201/npnf201.iii.x.vi.html"}]},
 "justin-app3": {kind: "spurious", label: "Not authentic",
   text: "A Christian composition about the “rain miracle” in Marcus Aurelius’ wars on the Danube. The storm is attested by other ancient writers, but the letter itself is “manifestly the work of a Christian, and no one now thinks of accepting it as genuine” (A. C. McGiffert).",
   src: [{t: "A. C. McGiffert, notes to Eusebius, Church History (NPNF II/1, 1890)", u: "https://ccel.org/ccel/schaff/npnf201/npnf201.iii.x.vi.html"}]},
 "iren-ah3": {kind: "debated", label: "Genuine; survives mainly in Latin",
   text: "Irenaeus’ own work (c. 180). The complete text survives only in an early Latin translation; much of the Greek is lost. In 3.3.2 the Greek is lost and the key Latin words (“propter potiorem principalitatem … convenire”) are understood in different ways; the ANF translators themselves write: “We are far from sure that the rendering given above is correct.”",
   src: [{t: "Ante-Nicene Fathers, vol. 1, note to Against Heresies 3.3.2", u: "https://www.ccel.org/ccel/schaff/anf01.ix.iv.iv.html"}, {t: "Against Heresies 3.3, Latin and translations (BKV, Fribourg)", u: "https://bkv.unifr.ch/en/works/cpg-1306/versions/against-heresies/divisions/413"}]},
 "cyp-unity": {kind: "debated", label: "Genuine; chapter 4 survives in two versions",
   text: "The treatise is Cyprian’s own (251). Chapter 4 survives in two forms: the so-called Primacy Text, with lines on the primacy and chair of Peter, and the Received Text without them. The Ante-Nicene editors (1880s) called the Primacy lines forgeries by later editors. Maurice Bévenot’s study of the manuscripts (1939; Oxford edition 1971) argued instead that both versions come from Cyprian himself, one being his own revision of the other. Which came first, and why he revised it, are still discussed.",
   src: [{t: "M. Bévenot, St Cyprian’s De Unitate Chap. 4 in the Light of the Manuscripts (1939)", u: "https://www.cambridge.org/core/journals/church-history/article/st-cyprians-de-unit-ate-chap-4-in-the-light-of-the-manuscripts-by-maurice-bevenot-the-bellarmine-series-iv-london-burns-oates-washbourne-ltd-1939-lxxxv-77-pages-7s-6d/DA6A616C92E5997F011CAAAEBE3A4FE9"}, {t: "M. Bévenot, Cyprian: De Lapsis and De Ecclesiae Catholicae Unitate (Oxford Early Christian Texts, 1971)", u: "https://www.cambridge.org/core/journals/scottish-journal-of-theology/article/cyprian-de-lapsis-and-de-ecclesiae-catholicae-unitate-text-arid-translation-oxford-early-christian-texts-by-maurice-bevenot-clarendon-press-oxford-university-press-1971-pp-xxiii-127-175/60A106F8EC243FD3D146E3AE497DF89B"}]},
 "2clem": {kind: "spurious", label: "Not by Clement",
   text: "Despite its title, “2 Clement” is not a letter and not by Clement of Rome: it is an anonymous sermon, usually dated to the first half of the 2nd century. Eusebius and Jerome already doubted the attribution.",
   src: [{t: "Encyclopedia of the Bible, “Epistles of Clement”", u: "https://search.biblegateway.com/resources/encyclopedia-of-the-bible/Epistles-Clement"}]},
 "dionysius": {kind: "spurious", label: "Pseudonymous (c. 500)",
   text: "The writings under the name of Dionysius the Areopagite (Acts 17:34) were composed c. 485–528 by an unknown author. In 1895 H. Koch and J. Stiglmayr showed independently that they draw on the Neoplatonist Proclus (d. 485); the first clear citation is by Severus of Antioch (518–528).",
   src: [{t: "Cambridge History of Philosophy in Late Antiquity, “Pseudo-Dionysius”", u: "https://www.cambridge.org/core/product/identifier/CBO9780511488450A020/type/BOOK_PART"}]},
 "donation": {kind: "spurious", label: "Forgery (8th century)",
   text: "The “Donation of Constantine”, in which Constantine gives the pope rule over the West, was forged in the second half of the 8th century. Nicholas of Cusa (1433) and Lorenzo Valla (1440) exposed it; Valla showed its Latin could not be 4th-century.",
   src: [{t: "Lorenzo Valla, Treatise on the Donation of Constantine (trans. C. B. Coleman, 1922)", u: "https://gutenberg.org/files/70092/70092-h/70092-h.htm"}]},
 "pseudoisidore": {kind: "spurious", label: "Forgery (9th century)",
   text: "The Pseudo-Isidorian Decretals are a 9th-century collection (c. 847–853) mixing genuine canons with forged letters of early popes. Letters of 1st–3rd-century popes quoted from it are not evidence for those centuries.",
   src: [{t: "On the Donation and the Pseudo-Isidorian collection (c. 847–853)", u: "https://faculty.washington.edu/ewebb/BobaDonatioConstantini.pdf"}]}
};
/* reader works and appended chapters */
var WORKS = {"1clem": "1clem", "ign-eph": "ign7", "ign-magn": "ign7", "ign-trall": "ign7", "ign-rom": "ign7", "ign-phld": "ign7", "ign-smyrn": "ign7", "ign-pol": "ign7",
  "pol-phil": "pol-phil", "mart-pol": "mart-pol", "didache": "didache", "justin-1apol": "justin-1apol", "iren-ah3": "iren-ah3", "cyp-unity": "cyp-unity"};
var CHAPTERS = {"justin-1apol~App. 1": "justin-app1", "justin-1apol~App. 2": "justin-app2", "justin-1apol~App. 3": "justin-app3", "cyp-unity~4": "cyp-unity", "iren-ah3~3": "iren-ah3"};

/* match a Church Father item in a study (free text) */
function match(author, work){
  var a = String(author || ""), w = String(work || ""), both = a + " " + w;
  if(/pseudo-?dionys|dionysius the areopagite|areopagite/i.test(both)) return "dionysius";
  if(/donation of constantine|constitutum constantini/i.test(both)) return "donation";
  if(/pseudo-?isidor|isidorian|false decretals/i.test(both)) return "pseudoisidore";
  if(/clement/i.test(a) && /\b(2|ii|second)\s*clem|second (epistle|letter)|homily/i.test(w)) return "2clem";
  if(/clement/i.test(a) && /\b(1|i|first)\s*clem|corinthians/i.test(w)) return "1clem";
  if(/ignatius/i.test(a)){
    if(/longer|interpolat|spurious/i.test(w)) return "ignlong";
    if(/ephes|magnes|trall|roman|philadelph|smyrn|polycarp/i.test(w)) return "ign7";
    if(/tarsians|antiochians|philippians|\bhero\b|cassob|to (st\.? )?john|to (the )?(blessed )?virgin|to mary|from mary/i.test(w)) return "ignlong";
  }
  if(/polycarp/i.test(a) && /philipp/i.test(w)) return "pol-phil";
  if(/martyrdom of polycarp/i.test(both)) return "mart-pol";
  if(/didache|teaching of the twelve/i.test(both)) return "didache";
  if(/justin/i.test(a) && /apolog/i.test(w)) return "justin-1apol";
  if(/iren/i.test(a) && /heres|haer/i.test(w)) return "iren-ah3";
  if(/cyprian/i.test(a) && /unity|unitate/i.test(w)) return "cyp-unity";
  return "";
}
function chip(id){ var e = A[id]; return e ? '<span class="au-chip au-'+e.kind+'">'+esc(e.label)+'</span>' : ""; }
function box(id, open){
  var e = A[id]; if(!e) return "";
  return '<details class="au-box au-'+e.kind+'"'+(open ? " open" : "")+'><summary title="'+esc(KIND[e.kind])+'"><span class="au-k">Authenticity</span> '+esc(e.label)+'</summary>' +
    '<p>'+esc(e.text)+'</p><p class="au-src"><b>Sources</b></p><ul class="au-src">' + e.src.map(function(s){ return '<li>'+(s.u ? '<a href="'+esc(s.u)+'" target="_blank" rel="noopener noreferrer">'+esc(s.t)+' ↗</a>' : esc(s.t))+'</li>'; }).join("") + '</ul></details>';
}
window.HCCAuth = {match: match, chip: chip, box: box, work: function(id){ return WORKS[id] || ""; }, chapter: function(id, n){ return CHAPTERS[id + "~" + n] || ""; }, get: function(id){ return A[id] || null; }};
})();
