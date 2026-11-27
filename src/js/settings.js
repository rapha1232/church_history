(function(){
"use strict";
/* Edition 19: the Settings page (language, backup, Bible editions from a file, offline study packs, updates, widgets)
   and the interface in English, Spanish, Portuguese, French and Arabic. Episodes and Bible texts stay in English. */
var $ = function(s,r){return (r||document).querySelector(s)};
var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var APP = window.HCCApp && window.HCCApp.isApp ? window.HCCApp : null;
function has(f){ return !!(APP && APP[f]); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function get(k,d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function haptic(){ try{ if(APP) APP.haptic("tick"); }catch(e){} }

/* ====================== language ====================== */
var LANGS = [["en","English"],["es","Español"],["pt","Português"],["fr","Français"],["ar","العربية"]];
var T = {
"Ready-made studies":["Estudios preparados", "Estudos prontos", "Études toutes prêtes", "دراسات جاهزة"], "Study added":["Estudio añadido", "Estudo adicionado", "Étude ajoutée", "أضيفت الدراسة"],
"Church Fathers in the Bible":["Padres de la Iglesia en la Biblia", "Padres da Igreja na Bíblia", "Pères de l’Église dans la Bible", "آباء الكنيسة في الكتاب المقدس"], "Show how many excerpts from the Church Fathers comment on each verse. Tap the number to read them.":["Muestra cuántos extractos de los Padres de la Iglesia comentan cada versículo. Toca el número para leerlos.", "Mostra quantos trechos dos Padres da Igreja comentam cada versículo. Toque no número para lê-los.", "Indique combien d’extraits des Pères de l’Église commentent chaque verset. Touchez le nombre pour les lire.", "يعرض عدد المقتطفات من آباء الكنيسة التي تعلق على كل آية. المس الرقم لقراءتها."],
"Both sides":["Ambas posturas", "Ambos os lados", "Les deux positions", "الجانبان"], "Unanswered":["Sin respuesta", "Sem resposta", "Sans réponse", "بلا رد"], "Threads":["Hilos", "Discussões", "Fils", "السلاسل"], "Answer this":["Responder", "Responder", "Répondre", "الرد على هذا"], "This answers (optional)":["Responde a (opcional)", "Responde a (opcional)", "Répond à (facultatif)", "يرد على (اختياري)"], "Nothing (a new point)":["Nada (un punto nuevo)", "Nada (um ponto novo)", "Rien (un nouveau point)", "لا شيء (نقطة جديدة)"],
"Default Bible":["Biblia predeterminada", "Bíblia padrão", "Bible par défaut", "الكتاب المقدس الافتراضي"], "The edition I am reading":["La edición que estoy leyendo", "A edição que estou lendo", "L’édition que je lis", "الطبعة التي أقرأها"], "Default Bible saved":["Biblia predeterminada guardada", "Bíblia padrão salva", "Bible par défaut enregistrée", "حُفظ الكتاب المقدس الافتراضي"], "Used for verses quoted in Studies, Bible references, the verse of the day and links that open the Bible. Books it does not have come from another edition.":["Se usa para los versículos citados en Estudios, las referencias bíblicas, el versículo del día y los enlaces que abren la Biblia. Los libros que no tiene se toman de otra edición.", "Usada nos versículos citados em Estudos, nas referências bíblicas, no versículo do dia e nos links que abrem a Bíblia. Os livros que ela não tem vêm de outra edição.", "Utilisée pour les versets cités dans les Études, les références bibliques, le verset du jour et les liens qui ouvrent la Bible. Les livres qu’elle n’a pas viennent d’une autre édition.", "تُستخدم للآيات المقتبسة في الدراسات والمراجع الكتابية وآية اليوم والروابط التي تفتح الكتاب المقدس. الأسفار غير الموجودة فيها تؤخذ من طبعة أخرى."],
"Series":["Serie", "Série", "Série", "السلسلة"], "Studies":["Estudios", "Estudos", "Études", "الدراسات"], "Bookmark":["Marcar", "Marcar", "Marquer", "إشارة"], "Bookmarks":["Marcadores", "Marcadores", "Signets", "الإشارات"], "Add to study":["Añadir a un estudio", "Adicionar a um estudo", "Ajouter à une étude", "أضف إلى دراسة"], "Added to":["Añadido a", "Adicionado a", "Ajouté à", "أضيف إلى"], "New study":["Nuevo estudio", "Novo estudo", "Nouvelle étude", "دراسة جديدة"], "Import a study file":["Importar un estudio", "Importar um estudo", "Importer une étude", "استيراد دراسة"], "Export as Markdown":["Exportar en Markdown", "Exportar em Markdown", "Exporter en Markdown", "تصدير بصيغة Markdown"], "Share as a file":["Compartir como archivo", "Compartilhar como arquivo", "Partager en fichier", "مشاركة كملف"], "Delete study":["Eliminar estudio", "Excluir estudo", "Supprimer l’étude", "حذف الدراسة"], "Add evidence":["Añadir prueba", "Adicionar evidência", "Ajouter un élément", "أضف دليلًا"], "Edit evidence":["Editar prueba", "Editar evidência", "Modifier l’élément", "تعديل الدليل"], "Edit":["Editar", "Editar", "Modifier", "تعديل"], "Delete":["Eliminar", "Excluir", "Supprimer", "حذف"], "Cancel":["Cancelar", "Cancelar", "Annuler", "إلغاء"], "Save changes":["Guardar cambios", "Salvar alterações", "Enregistrer", "حفظ التغييرات"], "Keep it":["Conservarlo", "Manter", "Garder", "احتفظ بها"], "Scripture":["Escritura", "Escritura", "Écriture", "الكتاب المقدس"], "Church Father":["Padre de la Iglesia", "Padre da Igreja", "Père de l’Église", "أب الكنيسة"], "Document":["Documento", "Documento", "Document", "وثيقة"], "Episode":["Episodio", "Episódio", "Épisode", "حلقة"], "Note":["Nota", "Nota", "Note", "ملاحظة"], "Link":["Enlace", "Link", "Lien", "رابط"], "Position":["Postura", "Posição", "Position", "الموقف"], "Bible reference":["Referencia bíblica", "Referência bíblica", "Référence biblique", "المرجع الكتابي"], "Author":["Autor", "Autor", "Auteur", "المؤلف"], "Quotation":["Cita", "Citação", "Citation", "الاقتباس"], "Your note (optional)":["Tu nota (opcional)", "Sua nota (opcional)", "Votre note (facultatif)", "ملاحظتك (اختياري)"], "← All studies":["← Todos los estudios", "← Todos os estudos", "← Toutes les études", "→ كل الدراسات"], "Your research":["Tu investigación", "Sua pesquisa", "Vos recherches", "بحثك"], "The Series":["La serie", "A série", "La série", "السلسلة"], "Fifteen seasons":["Quince temporadas", "Quinze temporadas", "Quinze saisons", "خمسة عشر موسمًا"], "All chapters":["Todos los capítulos", "Todos os capítulos", "Tous les chapitres", "كل الفصول"], "Method and sources":["Método y fuentes", "Método e fontes", "Méthode et sources", "المنهج والمصادر"], "Read everything on one page":["Leer todo en una página", "Ler tudo numa página", "Tout lire sur une page", "اقرأ كل شيء في صفحة واحدة"], "Start from the beginning":["Empezar desde el principio", "Começar do início", "Commencer au début", "ابدأ من البداية"], "Study companions":["Complementos de estudio", "Complementos de estudo", "Compléments d’étude", "مرافقات الدراسة"], "Yours":["Lo tuyo", "Seus itens", "Vos éléments", "الخاص بك"], "People and places":["Personas y lugares", "Pessoas e lugares", "Personnes et lieux", "أشخاص وأماكن"], "Councils and doctrine":["Concilios y doctrina", "Concílios e doutrina", "Conciles et doctrine", "المجامع والعقيدة"], "Texts and sources":["Textos y fuentes", "Textos e fontes", "Textes et sources", "النصوص والمصادر"], "Pictures":["Imágenes", "Imagens", "Images", "الصور"], "Bible companions":["Complementos bíblicos", "Complementos bíblicos", "Compléments bibliques", "مرافقات الكتاب المقدس"], "More":["Más", "Mais", "Plus", "المزيد"], "Evidence deleted":["Prueba eliminada", "Evidência excluída", "Élément supprimé", "حُذف الدليل"], "Study deleted":["Estudio eliminado", "Estudo excluído", "Étude supprimée", "حُذفت الدراسة"], "Study imported":["Estudio importado", "Estudo importado", "Étude importée", "استُوردت الدراسة"], "Name of the new study":["Nombre del nuevo estudio", "Nome do novo estudo", "Nom de la nouvelle étude", "اسم الدراسة الجديدة"],
"Contents":["Índice","Sumário","Sommaire","المحتويات"], "Search":["Buscar","Pesquisar","Rechercher","بحث"], "Texts":["Textos","Textos","Textes","النصوص"],
"Saved":["Guardado","Salvos","Enregistré","المحفوظات"], "Bible":["Biblia","Bíblia","Bible","الكتاب المقدس"], "Eras":["Épocas","Épocas","Époques","العصور"],
"Topics":["Temas","Temas","Thèmes","المواضيع"], "Theme":["Tema","Tema","Thème","السمة"], "Text size":["Tamaño del texto","Tamanho do texto","Taille du texte","حجم النص"],
"Line spacing":["Interlineado","Espaçamento","Interligne","تباعد الأسطر"], "Dim pictures":["Atenuar imágenes","Escurecer imagens","Assombrir les images","تعتيم الصور"],
"Accent":["Color de acento","Cor de destaque","Couleur d’accent","لون التمييز"], "Auto":["Auto","Auto","Auto","تلقائي"], "Light":["Claro","Claro","Clair","فاتح"],
"Sepia":["Sepia","Sépia","Sépia","بني"], "Night":["Noche","Noite","Nuit","ليلي"],
"Good morning":["Buenos días","Bom dia","Bonjour","صباح الخير"], "Good afternoon":["Buenas tardes","Boa tarde","Bon après-midi","طاب يومك"],
"Good evening":["Buenas noches","Boa noite","Bonsoir","مساء الخير"], "Good night":["Buenas noches","Boa noite","Bonne nuit","تصبح على خير"],
"Open the Bible":["Abrir la Biblia","Abrir a Bíblia","Ouvrir la Bible","افتح الكتاب المقدس"], "Nine editions":["Nueve ediciones","Nove edições","Neuf éditions","تسع طبعات"],
"On this day":["Tal día como hoy","Neste dia","Ce jour-là","في مثل هذا اليوم"], "Church calendar":["Calendario de la Iglesia","Calendário da Igreja","Calendrier de l’Église","تقويم الكنيسة"],
"Maps":["Mapas","Mapas","Cartes","الخرائط"], "Journeys of Scripture":["Viajes de la Escritura","Viagens da Escritura","Voyages de l’Écriture","رحلات الكتاب المقدس"],
"Family tree":["Árbol familiar","Árvore genealógica","Arbre généalogique","شجرة العائلة"], "How the churches divide":["Cómo se dividen las Iglesias","Como as Igrejas se dividem","Comment les Églises se divisent","كيف انقسمت الكنائس"],
"People":["Personas","Pessoas","Personnes","الأشخاص"], "148 lives":["148 vidas","148 vidas","148 vies","148 سيرة"],
"Quote of the day":["Cita del día","Citação do dia","Citation du jour","قول اليوم"], "Verse of the day":["Versículo del día","Versículo do dia","Verset du jour","آية اليوم"],
"Another":["Otra","Outra","Une autre","قول آخر"], "Copy":["Copiar","Copiar","Copier","نسخ"], "Copied":["Copiado","Copiado","Copié","تم النسخ"],
"Notifications and widgets":["Notificaciones y widgets","Notificações e widgets","Notifications et widgets","الإشعارات والأدوات"],
"Daily quote notification":["Notificación diaria de la cita","Notificação diária da citação","Notification quotidienne de la citation","إشعار يومي بالقول"],
"Time":["Hora","Hora","Heure","الوقت"], "Customize":["Personalizar","Personalizar","Personnaliser","تخصيص"], "Add Today":["Añadir Hoy","Adicionar Hoje","Ajouter Aujourd’hui","إضافة اليوم"],
"Add Quote":["Añadir Cita","Adicionar Citação","Ajouter Citation","إضافة القول"], "Add Verse":["Añadir Versículo","Adicionar Versículo","Ajouter Verset","إضافة الآية"],
"Widgets":["Widgets","Widgets","Widgets","الأدوات"],
"Today’s readings":["Lecturas de hoy","Leituras de hoje","Lectures du jour","قراءات اليوم"], "Reading plans":["Planes de lectura","Planos de leitura","Plans de lecture","خطط القراءة"],
"My notes":["Mis notas","Minhas notas","Mes notes","ملاحظاتي"], "People &amp; places":["Personas y lugares","Pessoas e lugares","Personnes et lieux","أشخاص وأماكن"],
"People & places":["Personas y lugares","Pessoas e lugares","Personnes et lieux","أشخاص وأماكن"], "Gospel harmony":["Armonía de los Evangelios","Harmonia dos Evangelhos","Harmonie des Évangiles","تناسق الأناجيل"],
"Psalter":["Salterio","Saltério","Psautier","المزامير"], "Original":["Original","Original","Original","الأصل"], "Editions":["Ediciones","Edições","Éditions","الطبعات"],
"Links":["Enlaces","Ligações","Liens","روابط"], "Commentary":["Comentario","Comentário","Commentaire","التفسير"], "Share card":["Tarjeta para compartir","Cartão para compartilhar","Carte à partager","بطاقة للمشاركة"],
"☆ Bookmark":["☆ Marcador","☆ Marcador","☆ Signet","☆ إشارة"], "✎ Note":["✎ Nota","✎ Nota","✎ Note","✎ ملاحظة"], "Close":["Cerrar","Fechar","Fermer","إغلاق"],
"Start plan":["Empezar plan","Começar plano","Commencer le plan","ابدأ الخطة"], "Skip":["Omitir","Pular","Passer","تخطٍّ"], "Back":["Atrás","Voltar","Retour","رجوع"],
"Key takeaways":["Ideas clave","Pontos-chave","À retenir","أهم النقاط"], "Why it matters today":["Por qué importa hoy","Por que importa hoje","Pourquoi c’est important aujourd’hui","لماذا يهم اليوم"],
"Where this episode happens":["Dónde ocurre este episodio","Onde acontece este episódio","Où se passe cet épisode","أين تجري هذه الحلقة"],
"Continue reading":["Seguir leyendo","Continuar a leitura","Reprendre la lecture","متابعة القراءة"], "Seasons":["Temporadas","Temporadas","Saisons","المواسم"],
"Extras":["Extras","Extras","Bonus","إضافات"], "Episodes":["Episodios","Episódios","Épisodes","الحلقات"],
/* settings page */
"Settings":["Ajustes","Configurações","Réglages","الإعدادات"], "Language":["Idioma","Idioma","Langue","اللغة"],
"The menus and buttons change; episodes and Bible texts stay in English.":["Cambian los menús y botones; los episodios y los textos bíblicos siguen en inglés.","Mudam os menus e botões; episódios e textos bíblicos continuam em inglês.","Les menus et boutons changent ; les épisodes et les textes bibliques restent en anglais.","تتغير القوائم والأزرار؛ وتبقى الحلقات ونصوص الكتاب المقدس بالإنجليزية."],
"Your reading and notes":["Tu lectura y tus notas","Sua leitura e anotações","Votre lecture et vos notes","قراءتك وملاحظاتك"],
"Bookmarks, notes, highlights, reading plans, chapters read and settings. Save them to a file to move them to another phone or browser.":["Marcadores, notas, subrayados, planes de lectura, capítulos leídos y ajustes. Guárdalos en un archivo para llevarlos a otro teléfono o navegador.","Marcadores, notas, destaques, planos de leitura, capítulos lidos e configurações. Salve-os num arquivo para levá-los a outro telefone ou navegador.","Signets, notes, surlignages, plans de lecture, chapitres lus et réglages. Enregistrez-les dans un fichier pour les transférer sur un autre téléphone ou navigateur.","الإشارات والملاحظات والتظليل وخطط القراءة والأصحاحات المقروءة والإعدادات. احفظها في ملف لنقلها إلى هاتف أو متصفح آخر."],
"Save to a file":["Guardar en un archivo","Salvar num arquivo","Enregistrer dans un fichier","احفظ في ملف"], "Restore from a file":["Restaurar desde un archivo","Restaurar de um arquivo","Restaurer depuis un fichier","استعادة من ملف"],
"Also kept by your phone’s backup, so a new phone or a reinstall gets it back.":["También lo guarda la copia de seguridad del teléfono, así un teléfono nuevo o una reinstalación lo recupera.","Também fica no backup do telefone, então um telefone novo ou uma reinstalação o recupera.","Aussi conservé par la sauvegarde du téléphone : un nouveau téléphone ou une réinstallation le récupère.","ويحفظه أيضًا النسخ الاحتياطي للهاتف، فيستعيده الهاتف الجديد أو إعادة التثبيت."],
"Last copy":["Última copia","Última cópia","Dernière copie","آخر نسخة"],
"Replace your reading progress on this device with the file’s?":["¿Reemplazar tu progreso en este dispositivo por el del archivo?","Substituir seu progresso neste dispositivo pelo do arquivo?","Remplacer votre progression sur cet appareil par celle du fichier ?","هل تستبدل تقدّمك على هذا الجهاز بما في الملف؟"],
"This file is not a Church History backup.":["Este archivo no es una copia de Historia de la Iglesia.","Este arquivo não é um backup da História da Igreja.","Ce fichier n’est pas une sauvegarde d’Histoire de l’Église.","هذا الملف ليس نسخة احتياطية من تاريخ الكنيسة."],
"Restored your reading progress.":["Se restauró tu progreso de lectura.","Seu progresso de leitura foi restaurado.","Votre progression a été restaurée.","تمت استعادة تقدّمك في القراءة."],
"Bible editions from a file":["Ediciones de la Biblia desde un archivo","Edições da Bíblia de um arquivo","Éditions de la Bible depuis un fichier","طبعات الكتاب المقدس من ملف"],
"Add a translation you have the right to use, as a JSON file. It is kept only on this device and appears with the other editions.":["Añade una traducción que tengas derecho a usar, como archivo JSON. Se guarda solo en este dispositivo y aparece con las demás ediciones.","Adicione uma tradução que você tem direito de usar, como arquivo JSON. Fica só neste dispositivo e aparece com as outras edições.","Ajoutez une traduction que vous avez le droit d’utiliser, en fichier JSON. Elle reste sur cet appareil et apparaît avec les autres éditions.","أضف ترجمة يحق لك استخدامها كملف JSON. تُحفظ على هذا الجهاز فقط وتظهر مع الطبعات الأخرى."],
"Name":["Nombre","Nome","Nom","الاسم"], "Short name":["Abreviatura","Sigla","Abréviation","الاختصار"], "Tradition":["Tradición","Tradição","Tradition","التقليد"],
"Choose a file":["Elegir un archivo","Escolher um arquivo","Choisir un fichier","اختر ملفًا"], "Add edition":["Añadir edición","Adicionar edição","Ajouter l’édition","أضف الطبعة"],
"Remove":["Quitar","Remover","Retirer","إزالة"], "Reading the file…":["Leyendo el archivo…","Lendo o arquivo…","Lecture du fichier…","جارٍ قراءة الملف…"],
"books":["libros","livros","livres","سفرًا"], "verses":["versículos","versículos","versets","آية"],
"No books were recognised in this file.":["No se reconoció ningún libro en este archivo.","Nenhum livro foi reconhecido neste arquivo.","Aucun livre n’a été reconnu dans ce fichier.","لم يُتعرّف على أي سفر في هذا الملف."],
"Arabic Bible":["Biblia en árabe","Bíblia em árabe","Bible en arabe","الكتاب المقدس بالعربية"],
"Smith–Van Dyck, 1865":["Smith–Van Dyck, 1865","Smith–Van Dyck, 1865","Smith–Van Dyck, 1865","ترجمة سميث وفان دايك، 1865"],
"Offline study packs":["Paquetes de estudio sin conexión","Pacotes de estudo offline","Packs d’étude hors ligne","حزم الدراسة دون اتصال"],
"Kept out of the app to make it smaller. Each part downloads the first time you open it; download a whole pack to use it offline.":["Fuera de la app para que pese menos. Cada parte se descarga la primera vez que la abres; descarga el paquete entero para usarlo sin conexión.","Fora do app para deixá-lo menor. Cada parte é baixada na primeira vez que você a abre; baixe o pacote inteiro para usá-lo offline.","Hors de l’app pour l’alléger. Chaque partie se télécharge à la première ouverture ; téléchargez tout le pack pour l’utiliser hors ligne.","خارج التطبيق لتصغير حجمه. يُنزَّل كل جزء أول مرة تفتحه؛ نزّل الحزمة كاملة لاستخدامها دون اتصال."],
"Greek and Hebrew word study":["Estudio de palabras en griego y hebreo","Estudo de palavras em grego e hebraico","Étude des mots grecs et hébreux","دراسة الكلمات اليونانية والعبرية"],
"Word by word, lexicons and concordance":["Palabra por palabra, léxicos y concordancia","Palavra por palavra, léxicos e concordância","Mot à mot, lexiques et concordance","كلمة بكلمة، والمعاجم، والفهرس"],
"Greek Bible":["Biblia griega","Bíblia grega","Bible grecque","الكتاب المقدس اليوناني"], "Septuagint and New Testament in Greek":["Septuaginta y Nuevo Testamento en griego","Septuaginta e Novo Testamento em grego","Septante et Nouveau Testament en grec","السبعينية والعهد الجديد باليونانية"],
"Latin Vulgate":["Vulgata latina","Vulgata latina","Vulgate latine","الفولغاتا اللاتينية"], "Clementine edition, 1592":["Edición clementina, 1592","Edição clementina, 1592","Édition clémentine, 1592","الطبعة الإكليمنضية، 1592"],
"Download":["Descargar","Baixar","Télécharger","تنزيل"], "Downloaded":["Descargado","Baixado","Téléchargé","تم التنزيل"], "Not downloaded":["Sin descargar","Não baixado","Non téléchargé","غير منزّل"],
"files":["archivos","arquivos","fichiers","ملفات"], "of":["de","de","sur","من"], "could not be downloaded":["no se pudieron descargar","não puderam ser baixados","n’ont pas pu être téléchargés","تعذّر تنزيلها"],
"Updates":["Actualizaciones","Atualizações","Mises à jour","التحديثات"], "Version":["Versión","Versão","Version","الإصدار"],
"Check for updates":["Buscar actualizaciones","Verificar atualizações","Rechercher des mises à jour","التحقق من التحديثات"],
"Offer new versions when the app opens":["Ofrecer versiones nuevas al abrir la app","Oferecer novas versões ao abrir o app","Proposer les nouvelles versions à l’ouverture","عرض الإصدارات الجديدة عند فتح التطبيق"],
"Updates come from your app store.":["Las actualizaciones llegan de tu tienda de apps.","As atualizações vêm da sua loja de apps.","Les mises à jour viennent de votre magasin d’applications.","تأتي التحديثات من متجر التطبيقات."],
"Home screen and lock screen widgets: themes, text size, Greek or Hebrew.":["Widgets de pantalla de inicio y de bloqueo: temas, tamaño de texto, griego o hebreo.","Widgets da tela inicial e de bloqueio: temas, tamanho do texto, grego ou hebraico.","Widgets d’accueil et de verrouillage : thèmes, taille du texte, grec ou hébreu.","أدوات الشاشة الرئيسية وشاشة القفل: السمات وحجم النص واليونانية أو العبرية."],
"Customize widgets":["Personalizar widgets","Personalizar widgets","Personnaliser les widgets","تخصيص الأدوات"], "More settings":["Más ajustes","Mais configurações","Plus de réglages","مزيد من الإعدادات"],
"Home":["Inicio","Início","Accueil","الرئيسية"], "Library":["Biblioteca","Biblioteca","Bibliothèque","المكتبة"],
"Read":["Leer","Ler","Lire","قراءة"], "Study":["Estudiar","Estudar","Étudier","دراسة"],
"Reference · This app":["Referencia · Esta app","Referência · Este app","Référence · Cette app","مرجع · هذا التطبيق"],
"Language, your reading and notes, Bible editions you add, offline packs and updates.":["Idioma, tu lectura y notas, ediciones de la Biblia que añadas, paquetes sin conexión y actualizaciones.","Idioma, sua leitura e anotações, edições da Bíblia que você adicionar, pacotes offline e atualizações.","Langue, votre lecture et vos notes, éditions de la Bible ajoutées, packs hors ligne et mises à jour.","اللغة، وقراءتك وملاحظاتك، وطبعات الكتاب المقدس التي تضيفها، والحزم دون اتصال، والتحديثات."],
"Recent":["Recientes","Recentes","Récentes","الأخيرة"], "Clear":["Borrar","Limpar","Effacer","مسح"], "Try":["Prueba","Experimente","Essayez","جرّب"],
"Bookmarked":["Guardado en marcadores","Salvo nos marcadores","Ajouté aux signets","أُضيفت إشارة"], "Bookmark removed":["Marcador quitado","Marcador removido","Signet retiré","أُزيلت الإشارة"],
"View":["Ver","Ver","Voir","عرض"], "Undo":["Deshacer","Desfazer","Annuler","تراجع"], "Highlight deleted":["Subrayado eliminado","Destaque excluído","Surlignage supprimé","حُذف التظليل"],
"Continue where you left off":["Sigue donde lo dejaste","Continue de onde parou","Reprenez où vous en étiez","تابع من حيث توقفت"], "Resume":["Seguir","Continuar","Reprendre","متابعة"], "min left":["min restantes","min restantes","min restantes","دقيقة متبقية"],
"What the Fathers said":["Qué dijeron los Padres","O que disseram os Padres","Ce qu’ont dit les Pères","ماذا قال الآباء"],
"Print or save as PDF":["Imprimir o guardar como PDF", "Imprimir ou salvar como PDF", "Imprimer ou enregistrer en PDF", "طباعة أو حفظ بصيغة PDF"],
"Saved. Open the file to print it or save it as PDF.":["Guardado. Abre el archivo para imprimirlo o guardarlo como PDF.", "Salvo. Abra o arquivo para imprimi-lo ou salvá-lo como PDF.", "Enregistré. Ouvrez le fichier pour l’imprimer ou l’enregistrer en PDF.", "تم الحفظ. افتح الملف لطباعته أو حفظه بصيغة PDF."],
"Could not save the page":["No se pudo guardar la página", "Não foi possível salvar a página", "Impossible d’enregistrer la page", "تعذّر حفظ الصفحة"],
"Timelines and calendars":["Cronologías y calendarios", "Cronologias e calendários", "Chronologies et calendriers", "التسلسل الزمني والتقاويم"],
"Worship and art":["Culto y arte", "Culto e arte", "Culte et art", "العبادة والفن"],
"All traditions":["Todas las tradiciones", "Todas as tradições", "Toutes les traditions", "كل التقاليد"],
"Roman":["Romano", "Romano", "Romain", "الروماني"],
"Byzantine":["Bizantino", "Bizantino", "Byzantin", "البيزنطي"],
"Maronite":["Maronita", "Maronita", "Maronite", "الماروني"],
"Anglican":["Anglicano", "Anglicano", "Anglican", "الأنجليكاني"],
"Movable feasts":["Fiestas móviles", "Festas móveis", "Fêtes mobiles", "الأعياد المتنقلة"],
"Year":["Año", "Ano", "Année", "السنة"],
"Today":["Hoy", "Hoje", "Aujourd’hui", "اليوم"],
"Today in the Church’s year":["Hoy en el año litúrgico", "Hoje no ano litúrgico", "Aujourd’hui dans l’année liturgique", "اليوم في السنة الطقسية"],
"Meanwhile in the world":["Mientras tanto en el mundo", "Enquanto isso no mundo", "Pendant ce temps dans le monde", "في الوقت نفسه في العالم"],
"All subjects":["Todos los temas", "Todos os temas", "Tous les sujets", "كل المواضيع"],
"God and the Trinity":["Dios y la Trinidad", "Deus e a Trindade", "Dieu et la Trinité", "الله والثالوث"],
"Christ":["Cristo", "Cristo", "Le Christ", "المسيح"],
"Sin and grace":["Pecado y gracia", "Pecado e graça", "Péché et grâce", "الخطيئة والنعمة"],
"Church and sacraments":["Iglesia y sacramentos", "Igreja e sacramentos", "Église et sacrements", "الكنيسة والأسرار"],
"Scripture and revelation":["Escritura y revelación", "Escritura e revelação", "Écriture et révélation", "الكتاب المقدس والوحي"],
"Matter and dualism":["Materia y dualismo", "Matéria e dualismo", "Matière et dualisme", "المادة والثنائية"],
"Images":["Imágenes", "Imagens", "Images", "الصور"],
"All periods":["Todas las épocas", "Todas as épocas", "Toutes les époques", "كل الحقب"],
"To 300":["Hasta 300", "Até 300", "Jusqu’à 300", "حتى 300"],
"After 1500":["Después de 1500", "Depois de 1500", "Après 1500", "بعد 1500"],
"Something like it today":["Algo parecido hoy", "Algo parecido hoje", "Un équivalent aujourd’hui", "ما يشبهها اليوم"],
"Follow the story":["Seguir la historia", "Seguir a história", "Suivre l’histoire", "تتبّع القصة"],
"Mediterranean":["Mediterráneo", "Mediterrâneo", "Méditerranée", "المتوسط"],
"World":["Mundo", "Mundo", "Monde", "العالم"],
"Play":["Reproducir", "Reproduzir", "Lecture", "تشغيل"],
"Pause":["Pausa", "Pausar", "Pause", "إيقاف مؤقت"],
"Most recent":["Lo más reciente", "Mais recentes", "Les plus récents", "الأحدث"],
"All":["Todo", "Tudo", "Tout", "الكل"],
"Councils":["Concilios", "Concílios", "Conciles", "المجامع"],
"Documents":["Documentos", "Documentos", "Documents", "الوثائق"],
"Quotes":["Citas", "Citações", "Citations", "الأقوال"],
"Glossary":["Glosario", "Glossário", "Glossaire", "المسرد"],
"Reference":["Referencia", "Referência", "Référence", "المراجع"],
"Prayers":["Oraciones", "Orações", "Prières", "الصلوات"],
"Rome":["Roma", "Roma", "Rome", "روما"],
"Constantinople":["Constantinopla", "Constantinopla", "Constantinople", "القسطنطينية"],
"Alexandria":["Alejandría", "Alexandria", "Alexandrie", "الإسكندرية"],
"Antioch":["Antioquía", "Antioquia", "Antioche", "أنطاكية"],
"Jerusalem":["Jerusalén", "Jerusalém", "Jérusalem", "القدس"],
"Canterbury":["Canterbury", "Cantuária", "Cantorbéry", "كانتربري"],
"Basilica":["Basílica", "Basílica", "Basilique", "البازيليكا"],
"Cross-in-square":["Cruz inscrita", "Cruz inscrita", "Croix inscrite", "الصليب داخل المربع"],
"Gothic cathedral":["Catedral gótica", "Catedral gótica", "Cathédrale gothique", "الكاتدرائية القوطية"],
"The Eucharist compared":["La Eucaristía comparada", "A Eucaristia comparada", "L’Eucharistie comparée", "مقارنة الإفخارستيا"],
"Why icons":["Por qué los iconos", "Por que ícones", "Pourquoi les icônes", "لماذا الأيقونات"],
"Reading the image":["Leer la imagen", "Ler a imagem", "Lire l’image", "قراءة الصورة"],
"The Mother of God":["La Madre de Dios", "A Mãe de Deus", "La Mère de Dieu", "والدة الإله"],
"The feasts":["Las fiestas", "As festas", "Les fêtes", "الأعياد"],
"East and West":["Oriente y Occidente", "Oriente e Ocidente", "Orient et Occident", "الشرق والغرب"],
"Prayer":["Oración", "Oração", "Prière", "الصلاة"],
"Search the history":["Buscar en la historia", "Pesquisar na história", "Rechercher dans l’histoire", "ابحث في التاريخ"],
"Search people, councils, terms, or John 3:16…":["Busca personas, concilios, términos o Juan 3:16…", "Pesquise pessoas, concílios, termos ou João 3:16…", "Cherchez des personnes, des conciles, des termes ou Jean 3,16…", "ابحث عن أشخاص أو مجامع أو مصطلحات أو يوحنا 3:16…"]
};
var IDX = {en:-1, es:0, pt:1, fr:2, ar:3};
function deviceLang(){ var l = (navigator.language || "en").slice(0,2).toLowerCase(); return IDX[l] != null ? l : "en"; }
var LANG = get("hcc.lang", "") || (has("getLanguage") ? (function(){ try{ return APP.getLanguage(); }catch(e){ return ""; } })() : "") || deviceLang();
if(IDX[LANG] == null) LANG = "en";
function t(en){ var r = T[en]; return r && IDX[LANG] >= 0 ? r[IDX[LANG]] : en; }
var SCOPE = ".tabbar, .ed21-nav, .ed21-tabs, .ed21-acts, .ed21-h, .ed21-sh, .ed21-ptools, .ed21-ph, .ed21-fld > label, .ed21-types, .ed21-dact, .st-acts, .st-kind, .st-back, .st-add, .st-lab, .ed21-addv, .ed21-addf, .ed21-addvs, .ed21-adddoc, .co-act, #series > .eyebrow, #series > h2, #library > .eyebrow, #studies > .eyebrow, #studies > h2, .bib-seg, .navtabs, .rset, .today-h, .today-jump, .qotd, .votd, .bib-tools, .vs-tabs, .vs-acts, .shelf-h, .shelves > p, .onb, #ref-settings, .wset, .card-set summary, .takeaways > h4, .why .shelf-h, .cal-bar, .cal-mvh, .hx-bar, .sc-tabs, .sp-views, .sp-h, .sx-f, .mw-h";
var ORIG = typeof WeakMap === "function" ? new WeakMap() : null;
function translate(){
  if(!ORIG) return;
  document.documentElement.lang = LANG;
  $$(SCOPE).forEach(function(root){
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while((n = w.nextNode())){
      var en = ORIG.has(n) ? ORIG.get(n) : n.nodeValue, key = en.trim();
      if(!key || !T[key]) continue;
      if(!ORIG.has(n)) ORIG.set(n, en);
      var want = LANG === "en" ? en : en.replace(key, t(key));
      if(n.nodeValue !== want) n.nodeValue = want;
    }
  });
}
var tq = 0;
function soon(){ clearTimeout(tq); tq = setTimeout(translate, 250); }
if(typeof MutationObserver === "function") new MutationObserver(function(){ if(LANG !== "en") soon(); }).observe(document.body, {childList: true, subtree: true});
function setLang(l){
  LANG = IDX[l] != null ? l : "en"; put("hcc.lang", LANG);
  if(has("setLanguage")) try{ APP.setLanguage(LANG === "en" && deviceLang() === "en" ? "" : LANG); }catch(e){}
  translate(); render();
  try{ dispatchEvent(new Event("hcc:lang")); }catch(e){}
}

/* ====================== backup of everything the reader has made ====================== */
var SKIP = {"hcc.useds": 1};
function mine(k){ return (k.indexOf("hcc.") === 0 || k === "theme") && !SKIP[k]; }
function snapshot(){
  var o = {};
  try{ for(var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if(mine(k)) o[k] = localStorage.getItem(k); } }catch(e){}
  return {app: "church-history", v: 1, at: new Date().toISOString(), data: o};
}
function restore(b){
  if(!b || b.app !== "church-history" || !b.data || typeof b.data !== "object") throw new Error("not a backup");
  var old = []; for(var i = 0; i < localStorage.length; i++){ var k0 = localStorage.key(i); if(mine(k0) && !(k0 in b.data)) old.push(k0); }
  old.forEach(function(k){ localStorage.removeItem(k); });
  Object.keys(b.data).forEach(function(k){ if(mine(k) && typeof b.data[k] === "string") localStorage.setItem(k, b.data[k]); });
}
function saveFile(){
  var json = JSON.stringify(snapshot(), null, 1), name = "church-history-backup-" + new Date().toISOString().slice(0,10) + ".json";
  if(has("saveFile")){ APP.saveFile(name, "application/json", json); return; }
  var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json], {type: "application/json"})); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function readFile(f, cb){ var r = new FileReader(); r.onload = function(){ cb(String(r.result || "")); }; r.onerror = function(){ cb(""); }; r.readAsText(f); }
function loadBackup(f){
  readFile(f, function(txt){
    var b; try{ b = JSON.parse(txt); }catch(e){ b = null; }
    if(!b || b.app !== "church-history"){ alert(t("This file is not a Church History backup.")); return; }
    if(!confirm(t("Replace your reading progress on this device with the file’s?"))) return;
    restore(b); mirror(true); alert(t("Restored your reading progress.")); location.reload();
  });
}
/* the app keeps a copy outside the WebView (and in Android's backup), refreshed whenever something changed */
var lastCopy = "";
function mirror(force){
  if(!has("backupPut")) return;
  var s = snapshot(), key = JSON.stringify(s.data);
  if(!force && key === lastCopy) return; lastCopy = key;
  try{ APP.backupPut(JSON.stringify(s)); }catch(e){}
}
if(has("backupPut")){
  setTimeout(function(){ mirror(); }, 4000); setInterval(mirror, 60000);
  document.addEventListener("visibilitychange", function(){ if(document.hidden) mirror(); });
  addEventListener("pagehide", function(){ mirror(); });
}
/* new phone or reinstall: the page's storage is empty but the app's copy came back with Android's backup */
(function(){
  if(!has("backupGet")) return;
  var KEY = ["hcc.read","hcc.bible","hcc.notes","hcc.bnotes","hcc.plan","hcc.bplan","hcc.watch","hcc.bible.read"];
  var empty = KEY.every(function(k){ try{ return localStorage.getItem(k) == null; }catch(e){ return false; } });
  if(!empty) return;
  try{ if(sessionStorage.getItem("hcc.restored")) return; }catch(e){}
  var b; try{ b = JSON.parse(APP.backupGet() || "null"); }catch(e){ b = null; }
  if(!b || !b.data || !KEY.some(function(k){ return b.data[k] != null; })) return;
  try{ restore(b); sessionStorage.setItem("hcc.restored", "1"); location.reload(); }catch(e){}
})();

/* ====================== Bible editions from a file ====================== */
var BOOKALIAS = {"songofsongs":"SOL","songofsolomon":"SOL","canticles":"SOL","canticleofcanticles":"SOL","song":"SOL","psalm":"PSA","psalms":"PSA",
  "revelation":"REV","apocalypse":"REV","revelations":"REV","sirach":"SIR","ecclesiasticus":"SIR","qoheleth":"ECC","ecclesiastes":"ECC",
  "wisdom":"WIS","wisdomofsolomon":"WIS","1kings":"1KI","2kings":"2KI","1samuel":"1SA","2samuel":"2SA","3kings":"1KI","4kings":"2KI",
  "1paralipomenon":"1CH","2paralipomenon":"2CH","1esdras":"1ES","2esdras":"2ES","tobias":"TOB","tobit":"TOB","judith":"JDT","baruch":"BAR",
  "1maccabees":"1MA","2maccabees":"2MA","3maccabees":"3MA","4maccabees":"4MA","acts":"ACT","actsoftheapostles":"ACT","philemon":"PHM",
  "philippians":"PHI","jude":"JUD","james":"JAM","john":"JOH","1john":"1JO","2john":"2JO","3john":"3JO","joel":"JOE","ezekiel":"EZE","mark":"MAR",
  "matthew":"MAT","luke":"LUK","judges":"JDG","nahum":"NAH","obadiah":"OBA","zephaniah":"ZEP","zechariah":"ZEC","habakkuk":"HAB","haggai":"HAG"};
function norm(s){ return String(s||"").toLowerCase().replace(/^(iii|ii|i)\s+/, function(m){ return {"i ":"1","ii ":"2","iii ":"3"}[m] || m; }).replace(/^(first|second|third)\s+/, function(m){ return {"first ":"1","second ":"2","third ":"3"}[m]; }).replace(/[^a-z0-9]/g, ""); }
function bookTable(){
  var tb = {}, M = window.__BIBMAN__ || {eds: []};
  ["webc","webo","kjva","web","kjv"].forEach(function(id){
    var e = M.eds.filter(function(x){ return x.id === id; })[0]; if(!e) return;
    e.books.forEach(function(b){ var n = norm(b[2]); if(!tb[n]) tb[n] = b[0]; if(!tb[b[0].toLowerCase()]) tb[b[0].toLowerCase()] = b[0]; });
  });
  Object.keys(BOOKALIAS).forEach(function(k){ tb[k] = BOOKALIAS[k]; });
  return tb;
}
/* accepted: [{book, chapters:[{chapter, verses:[{verse, text}]}]}], {books:[…]}, or {"Genesis": {"1": {"1": "text"}}} */
function parseEdition(data){
  var tb = bookTable(), out = {}, n = 0;
  function add(name, chs){
    var code = tb[norm(name)]; if(!code) return;
    var list = [];
    chs.forEach(function(ch){
      var c = parseInt(ch[0], 10); if(!(c > 0)) return;
      var vs = ch[1].map(function(v){ return [parseInt(v[0], 10), String(v[1] == null ? "" : v[1]).replace(/\s+/g, " ").trim()]; })
        .filter(function(v){ return v[0] > 0 && v[1]; }).sort(function(a, b){ return a[0] - b[0]; });
      if(vs.length){ list.push([c, vs]); n += vs.length; }
    });
    if(list.length) out[code] = list.sort(function(a, b){ return a[0] - b[0]; });
  }
  var arr = Array.isArray(data) ? data : data && Array.isArray(data.books) ? data.books : null;
  if(arr) arr.forEach(function(b){
    if(!b) return;
    var chs = (b.chapters || b.Chapters || []).map(function(c){
      var vs = c.verses || c.Verses || [];
      return [c.chapter || c.Chapter || c.number, vs.map(function(v){ return [v.verse || v.Verse || v.number, v.text || v.Text]; })];
    });
    add(b.book || b.name || b.Book || b.abbrev, chs);
  });
  else if(data && typeof data === "object") Object.keys(data).forEach(function(name){
    var bk = data[name]; if(!bk || typeof bk !== "object") return;
    add(name, Object.keys(bk).map(function(c){ var ch = bk[c] || {}; return [c, Object.keys(ch).map(function(v){ return [v, ch[v]]; })]; }));
  });
  return {books: out, verses: n};
}
function editionMeta(id, name, short, trad, books){
  var M = window.__BIBMAN__ || {eds: []}, ref = null, order = [];
  ["webc","webo","kjva","kjv"].forEach(function(x){ var e = M.eds.filter(function(y){ return y.id === x; })[0]; if(e) e.books.forEach(function(b){ if(order.every(function(o){ return o[0] !== b[0]; })) order.push(b); }); });
  var list = order.filter(function(b){ return books[b[0]]; }).map(function(b){ var ch = books[b[0]]; return [b[0], id, b[2], ch[ch.length - 1][0], b[4]]; });
  return {id: id, name: name, short: short, trad: trad || "Added from a file", year: "", note: "Added on this device from a file you chose. Its text is kept only here.", books: list};
}

/* ====================== the Settings page ====================== */
var PACKS = {study: ["Greek and Hebrew word study", "Word by word, lexicons and concordance"], greek: ["Greek Bible", "Septuagint and New Testament in Greek"], latin: ["Latin Vulgate", "Clementine edition, 1592"], arabic: ["Arabic Bible", "Smith–Van Dyck, 1865"]};
var packProg = {};
window.HCCPackProgress = function(p){
  if(!p) return; packProg[p.pack] = p;
  var row = $('[data-pack="' + p.pack + '"]'); if(!row) return;
  var bar = $(".pk-bar i", row); if(bar) bar.style.width = (p.total ? Math.round(100 * p.done / p.total) : 0) + "%";
  if(p.done >= p.total){ delete packProg[p.pack]; setTimeout(render, 400); }
};
function section(h, body){ return '<section class="set-sec"><h3>' + esc(t(h)) + '</h3>' + body + '</section>'; }
function packRows(){
  var st = {}; try{ st = JSON.parse(APP.packsStatus() || "{}"); }catch(e){}
  return Object.keys(PACKS).filter(function(k){ return st[k]; }).map(function(k){
    var s = st[k], all = s.have >= s.files, busy = !!packProg[k];
    var state = all ? t("Downloaded") : s.have ? s.have + " " + t("of") + " " + s.files + " " + t("files") : t("Not downloaded");
    return '<div class="set-row" data-pack="' + k + '"><span><b>' + esc(t(PACKS[k][0])) + '</b><small>' + esc(t(PACKS[k][1])) + ' · ' + s.mb + ' MB · ' + esc(state) + '</small>' +
      (busy ? '<span class="pk-bar"><i></i></span>' : '') + '</span><span class="set-b">' +
      (all ? '' : '<button type="button" class="btn-sm pri" data-do="pack-get" data-k="' + k + '"' + (busy ? ' disabled' : '') + '>' + esc(t("Download")) + '</button>') +
      (s.have ? '<button type="button" class="btn-sm" data-do="pack-rm" data-k="' + k + '"' + (busy ? ' disabled' : '') + '>' + esc(t("Remove")) + '</button>' : '') + '</span></div>';
  }).join("");
}
function render(){
  var host = $("#ref-settings .set-mount"); if(!host) return;
  var h = "";
  h += section("Language", '<div class="set-row"><span><small>' + esc(t("The menus and buttons change; episodes and Bible texts stay in English.")) + '</small></span><span class="set-b"><select id="setLang" aria-label="' + esc(t("Language")) + '">' +
    LANGS.map(function(l){ return '<option value="' + l[0] + '"' + (l[0] === LANG ? " selected" : "") + '>' + l[1] + '</option>'; }).join("") + '</select></span></div>');
  var when = has("backupTime") ? (function(){ try{ var ms = APP.backupTime(); return ms > 0 ? new Date(ms).toLocaleString() : ""; }catch(e){ return ""; } })() : "";
  h += section("Church Fathers in the Bible", '<label class="set-row"><span><small>' + esc(t("Show how many excerpts from the Church Fathers comment on each verse. Tap the number to read them.")) + '</small></span><input type="checkbox" class="switch" id="setFcount"' + (get("hcc.bible.fcount", "1") !== "0" ? " checked" : "") + '></label>');
  var DE = (window.__BIBMAN__ || {eds: []}).eds, de = get("hcc.bible.def", "");
  h += section("Default Bible", '<div class="set-row"><span><small>' + esc(t("Used for verses quoted in Studies, Bible references, the verse of the day and links that open the Bible. Books it does not have come from another edition.")) + '</small></span><span class="set-b"><select id="setDefEd" style="width:100%;max-width:100%;min-width:0" aria-label="' + esc(t("Default Bible")) + '"><option value="">' + esc(t("The edition I am reading")) + '</option>' +
    DE.map(function(e){ return '<option value="' + esc(e.id) + '"' + (e.id === de ? " selected" : "") + '>' + esc(e.short + " · " + e.name) + '</option>'; }).join("") + '</select></span></div>');
  h += section("Your reading and notes", '<p class="set-p">' + esc(t("Bookmarks, notes, highlights, reading plans, chapters read and settings. Save them to a file to move them to another phone or browser.")) + '</p>' +
    (APP ? '<p class="set-p">' + esc(t("Also kept by your phone’s backup, so a new phone or a reinstall gets it back.")) + (when ? ' ' + esc(t("Last copy")) + ': ' + esc(when) + '.' : '') + '</p>' : '') +
    '<div class="set-b"><button type="button" class="btn-sm pri" data-do="bk-save">' + esc(t("Save to a file")) + '</button><label class="btn-sm">' + esc(t("Restore from a file")) + '<input type="file" accept="application/json,.json" hidden id="setBk"></label></div>');
  var ue = window.HCCUserEd ? HCCUserEd.list() : [];
  h += section("Bible editions from a file", '<p class="set-p">' + esc(t("Add a translation you have the right to use, as a JSON file. It is kept only on this device and appears with the other editions.")) + '</p>' +
    ue.map(function(e){ return '<div class="set-row"><span><b>' + esc(e.name) + ' (' + esc(e.short) + ')</b><small>' + e.books.length + ' ' + esc(t("books")) + '</small></span><span class="set-b"><button type="button" class="btn-sm" data-do="ed-rm" data-id="' + esc(e.id) + '">' + esc(t("Remove")) + '</button></span></div>'; }).join("") +
    '<div class="set-form"><label>' + esc(t("Name")) + '<input id="edName" placeholder="New American Bible, Revised Edition"></label><label>' + esc(t("Short name")) + '<input id="edShort" maxlength="8" placeholder="NABRE"></label>' +
    '<label>' + esc(t("Tradition")) + '<input id="edTrad" placeholder="Catholic"></label><label class="btn-sm">' + esc(t("Choose a file")) + '<input type="file" accept="application/json,.json" hidden id="edFile"></label><p class="set-p" id="edMsg" aria-live="polite"></p></div>');
  if(has("packsStatus")) h += section("Offline study packs", '<p class="set-p">' + esc(t("Kept out of the app to make it smaller. Each part downloads the first time you open it; download a whole pack to use it offline.")) + '</p>' + packRows());
  if(has("openWidgets")) h += section("Widgets", '<div class="set-row"><span><small>' + esc(t("Home screen and lock screen widgets: themes, text size, Greek or Hebrew.")) + '</small></span><span class="set-b"><button type="button" class="btn-sm pri" data-do="widgets">' + esc(t("Customize widgets")) + '</button></span></div>');
  if(has("checkUpdate")){
    var self = true; try{ self = APP.canSelfUpdate(); }catch(e){}
    var v = ""; try{ v = APP.appVersion(); }catch(e){}
    h += section("Updates", '<div class="set-row"><span><b>' + esc(t("Version")) + ' ' + esc(v) + '</b>' + (self ? '' : '<small>' + esc(t("Updates come from your app store.")) + '</small>') + '</span><span class="set-b">' +
      (self ? '<button type="button" class="btn-sm pri" data-do="upd">' + esc(t("Check for updates")) + '</button>' : '') + '</span></div>' +
      (self ? '<label class="set-row"><span><small>' + esc(t("Offer new versions when the app opens")) + '</small></span><input type="checkbox" class="switch" id="setAuto"' + (APP.autoUpdate() ? " checked" : "") + '></label>' : ''));
  }
  host.innerHTML = h;
  Object.keys(packProg).forEach(function(k){ window.HCCPackProgress(packProg[k]); });
  translate();
}
document.addEventListener("change", function(e){
  var el = e.target;
  if(el.id === "setLang"){ haptic(); setLang(el.value); }
  else if(el.id === "setFcount"){ put("hcc.bible.fcount", el.checked ? "1" : "0"); if(window.HCCFathersCount) HCCFathersCount.refresh(); }
  else if(el.id === "setDefEd"){ put("hcc.bible.def", el.value); try{ var b0 = get("hcc.bible", null); if(!b0 && el.value){ put("hcc.bible", {ed: el.value, b: "JOH", c: 1, cmp: "", v: 0}); } }catch(err){} if(window.HCCToast) HCCToast(t("Default Bible saved")); }
  else if(el.id === "setAuto"){ try{ APP.setAutoUpdate(el.checked); }catch(err){} }
  else if(el.id === "setBk" && el.files && el.files[0]){ loadBackup(el.files[0]); el.value = ""; }
  else if(el.id === "edFile" && el.files && el.files[0]){ importEdition(el.files[0]); el.value = ""; }
});
document.addEventListener("click", function(e){
  var b = e.target.closest("#ref-settings [data-do]"); if(!b) return; haptic();
  var d = b.dataset.do;
  if(d === "bk-save") saveFile();
  else if(d === "widgets") APP.openWidgets();
  else if(d === "upd") APP.checkUpdate();
  else if(d === "pack-get"){ packProg[b.dataset.k] = {pack: b.dataset.k, done: 0, total: 1}; render(); APP.packDownload(b.dataset.k); }
  else if(d === "pack-rm"){ APP.packRemove(b.dataset.k); render(); }
  else if(d === "ed-rm" && window.HCCUserEd){ HCCUserEd.remove(b.dataset.id).then(function(){ location.reload(); }); }
});
function importEdition(f){
  var msg = $("#edMsg"); if(msg) msg.textContent = t("Reading the file…");
  readFile(f, function(txt){
    var data; try{ data = JSON.parse(txt); }catch(e){ data = null; }
    var r = data ? parseEdition(data) : {books: {}, verses: 0}, codes = Object.keys(r.books);
    if(!codes.length){ if(msg) msg.textContent = t("No books were recognised in this file."); return; }
    var short = ($("#edShort").value || f.name.replace(/\.json$/i, "").slice(0, 8)).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") || "MY";
    var name = ($("#edName").value || short).trim(), id = "u" + Date.now().toString(36);
    var meta = editionMeta(id, name, short, ($("#edTrad").value || "").trim(), r.books);
    if(msg) msg.textContent = codes.length + " " + t("books") + " · " + r.verses.toLocaleString() + " " + t("verses");
    HCCUserEd.save(meta, r.books).then(function(){ setTimeout(function(){ location.reload(); }, 600); }).catch(function(){ if(msg) msg.textContent = "IndexedDB error"; });
  });
}

/* the page itself, and a way in from the reading-settings panel */
function link(){
  var p = $(".rset"); if(!p || $(".rs-more", p)) return;
  var a = document.createElement("a"); a.className = "rs-more btn-sm"; a.href = "#ref-settings"; a.textContent = t("More settings") + " →";
  a.addEventListener("click", function(){ p.hidden = true; });
  p.appendChild(a);
}
var css = document.createElement("style");
css.textContent = ".set-sec{margin:0 0 26px;padding:16px 18px;border:1px solid var(--rule);border-radius:14px;background:var(--panel)}"+
  ".set-sec h3{margin:0 0 8px;font-size:1.1rem}.set-sec h3::before{display:none}.set-p{margin:0 0 10px;font:14px/1.55 var(--font-ui);color:var(--muted)}"+
  ".set-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 14px;padding:12px 0;border-top:1px solid var(--rule);font:14px var(--font-ui)}"+
  ".set-row:first-of-type{border-top:0}.set-row>span:first-child{display:flex;flex-direction:column;gap:3px;flex:1 1 200px;min-width:0}.set-row small{font:12.5px/1.45 var(--font-ui);color:var(--muted)}"+
  ".set-b{display:flex;flex-wrap:wrap;gap:8px}.set-b .btn-sm,.set-form .btn-sm{min-height:40px}.set-b select{font:14px var(--font-ui);padding:8px 10px;border:1px solid var(--rule);border-radius:8px;background:var(--paper);color:var(--ink);min-height:40px}"+
  ".set-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;align-items:end;margin-top:8px}.set-form label:not(.btn-sm){display:flex;flex-direction:column;gap:4px;font:600 12px var(--font-ui);color:var(--muted)}"+
  ".set-form input:not([type=file]){font:14px var(--font-ui);padding:9px 10px;border:1px solid var(--rule);border-radius:8px;background:var(--paper);color:var(--ink);min-height:40px}.set-form .set-p{grid-column:1/-1;margin:0}"+
  ".pk-bar{display:block;height:6px;border-radius:3px;background:var(--rule);overflow:hidden;margin-top:6px}.pk-bar i{display:block;height:100%;width:0;background:var(--accent);transition:width .3s}"+
  ".rs-more{display:flex;justify-content:center;margin-top:12px}";
document.head.appendChild(css);
function route(){ if(location.hash === "#ref-settings") render(); link(); if(LANG !== "en") translate(); }
addEventListener("hashchange", function(){ setTimeout(route, 120); });
[300, 1300, 2600].forEach(function(ms){ setTimeout(route, ms); });
window.HCCSettings = {render: render, lang: function(){ return LANG; }, t: t};
})();
