"""Edition 21: navigation and Studies. Run after tools/v20.py, from the repository root:

    python3 tools/v20.py && python3 tools/v21.py

Idempotent. What it does to site/index.html:
  1. Adds three pages to <main>: Series, Library and Studies (filled in by tools/v21.js).
  2. Lets the router open sub-routes such as #studies~<id> on their page.
  3. Exposes reference parsing, verse text and the Fathers' commentary from the Bible script (window.HCCBible),
     so Studies can show verses and quote the Fathers.
  4. Points the "Bookmarked · View" toast at the Library page (the Saved tab is gone).
  5. Adds the new labels to the interface translations (es, pt, fr, ar).
  6. Appends tools/v21.css and tools/v21.js at the end of <body>, after the Edition 20 layer.
"""
import os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PAGE = os.path.join(ROOT, 'site', 'index.html')
s = open(PAGE, encoding='utf-8').read()
n0 = len(s)

def once(old, new, label):
    global s
    if new in s:
        print('  %-30s already applied' % label); return
    if s.count(old) != 1:
        sys.exit('v21: expected exactly one match for %s, found %d' % (label, s.count(old)))
    s = s.replace(old, new); print('  %-30s done' % label)

print('Edition 21: navigation and Studies')

# 1. pages
PAGES = ('<article id="series" data-title="Series" data-kind="hub"></article>'
         '<article id="library" data-title="Library" data-kind="hub"></article>'
         '<article id="studies" data-title="Studies" data-kind="hub"></article>')
once('<main id="main" tabindex="-1">\n', '<main id="main" tabindex="-1">\n' + PAGES + '\n', 'pages')

# 2. sub-routes (#studies~id, #bible~kjv~JOH~3~16) open their page
m = re.search(r'function articleFor\(id\)\{\s*if\(byId\[id\]\) return byId\[id\];', s)
TILDE = 'var tl = String(id).indexOf("~"); if(tl > 0 && byId[id.slice(0, tl)]) return byId[id.slice(0, tl)];'
if TILDE in s: print('  %-30s already applied' % 'sub-routes')
elif m: s = s[:m.end()] + '\n  ' + TILDE + s[m.end():]; print('  %-30s done' % 'sub-routes')
else: sys.exit('v21: articleFor not found')

# 3. Bible API
API = '''window.HCCBible = {go: go,
  /* Edition 21: for Studies */
  parse: function(q){ var x = String(q || "").replace(/[\\u2013\\u2014]/g, "-").match(/^(.*?\\d+(?:\\s*[:.,]\\s*\\d+)?)\\s*(?:-\\s*(\\d+))?\\s*$/), r = x ? parseRef(x[1]) : null; if(!r || !r.v) return null; var v2 = x[2] ? Math.max(+x[2], r.v) : r.v; return {b: r.b, c: r.c, v: r.v, v2: v2}; },
  label: function(b, c, v, v2){ try{ return shortName(qEd(b), b) + " " + c + ":" + v + (v2 && v2 !== v ? "\\u2013" + v2 : ""); }catch(e){ return b + " " + c + ":" + v; } },
  text: function(r, cb){ try{ var ed = qEd(r.b), ch = xchap(ed, r.b, r.c), src = srcOf(ed, r.b); if(!src) return cb(null);
    load(src, r.b, function(d){ var t = (chapter(d, ch) || []).filter(function(x){ return x[0] >= r.v && x[0] <= (r.v2 || r.v); }).map(function(x){ return x[1]; }).join(" ").replace(/\\s+/g, " ").trim();
      cb(t ? {text: t, ed: ED[ed].short, label: shortName(ed, r.b) + " " + r.c + ":" + r.v + (r.v2 && r.v2 !== r.v ? "\\u2013" + r.v2 : "")} : null); }); }catch(e){ cb(null); } },
  fathers: function(r, cb){ try{ var ob = origBook(r.b) || r.b, ch = engCh(edFor(r.b), r.b, r.c), g = grpOf(ob);
    script("bible/fath/"+g+".js", function(){ return !!FATH[ob] || FATH["__"+g]; }, function(){ FATH["__"+g] = 1; var L = [];
      (pick(FATH[ob], ch) || []).forEach(function(e){ if(r.v >= e[0] && r.v <= e[1]) L.push({author: e[2], work: String(e[3]).replace(/^Catena Aurea by Aquinas$/, "quoted in Aquinas, Catena Aurea"), text: e[4], date: e[5] || ""}); });
      cb(L); }); }catch(e){ cb([]); } },
  cur: function(){ return cur; }
};'''
once('window.HCCBible = {go: go};', API, 'Bible API')

# 4. "Bookmarked · View" goes to the Library page
once("""var t = document.querySelector('.tabbar [data-t="saved"]'); if(t) t.click();""", 'location.hash = "library";', 'bookmark toast')

# 5. translations
TR = {
 "Series": ["Serie","Série","Série","السلسلة"], "Studies": ["Estudios","Estudos","Études","الدراسات"],
 "Bookmark": ["Marcar","Marcar","Marquer","إشارة"], "Bookmarks": ["Marcadores","Marcadores","Signets","الإشارات"],
 "Add to study": ["Añadir a un estudio","Adicionar a um estudo","Ajouter à une étude","أضف إلى دراسة"],
 "Added to": ["Añadido a","Adicionado a","Ajouté à","أضيف إلى"],
 "New study": ["Nuevo estudio","Novo estudo","Nouvelle étude","دراسة جديدة"],
 "Import a study file": ["Importar un estudio","Importar um estudo","Importer une étude","استيراد دراسة"],
 "Export as Markdown": ["Exportar en Markdown","Exportar em Markdown","Exporter en Markdown","تصدير بصيغة Markdown"],
 "Share as a file": ["Compartir como archivo","Compartilhar como arquivo","Partager en fichier","مشاركة كملف"],
 "Delete study": ["Eliminar estudio","Excluir estudo","Supprimer l’étude","حذف الدراسة"],
 "Add evidence": ["Añadir prueba","Adicionar evidência","Ajouter un élément","أضف دليلًا"],
 "Edit evidence": ["Editar prueba","Editar evidência","Modifier l’élément","تعديل الدليل"],
 "Edit": ["Editar","Editar","Modifier","تعديل"], "Delete": ["Eliminar","Excluir","Supprimer","حذف"],
 "Cancel": ["Cancelar","Cancelar","Annuler","إلغاء"], "Save changes": ["Guardar cambios","Salvar alterações","Enregistrer","حفظ التغييرات"],
 "Keep it": ["Conservarlo","Manter","Garder","احتفظ بها"],
 "Scripture": ["Escritura","Escritura","Écriture","الكتاب المقدس"], "Church Father": ["Padre de la Iglesia","Padre da Igreja","Père de l’Église","أب الكنيسة"],
 "Document": ["Documento","Documento","Document","وثيقة"], "Episode": ["Episodio","Episódio","Épisode","حلقة"],
 "Note": ["Nota","Nota","Note","ملاحظة"], "Link": ["Enlace","Link","Lien","رابط"],
 "Position": ["Postura","Posição","Position","الموقف"],
 "Bible reference": ["Referencia bíblica","Referência bíblica","Référence biblique","المرجع الكتابي"],
 "Author": ["Autor","Autor","Auteur","المؤلف"], "Quotation": ["Cita","Citação","Citation","الاقتباس"],
 "Your note (optional)": ["Tu nota (opcional)","Sua nota (opcional)","Votre note (facultatif)","ملاحظتك (اختياري)"],
 "← All studies": ["← Todos los estudios","← Todos os estudos","← Toutes les études","→ كل الدراسات"],
 "Your research": ["Tu investigación","Sua pesquisa","Vos recherches","بحثك"],
 "The Series": ["La serie","A série","La série","السلسلة"], "Fifteen seasons": ["Quince temporadas","Quinze temporadas","Quinze saisons","خمسة عشر موسمًا"],
 "All chapters": ["Todos los capítulos","Todos os capítulos","Tous les chapitres","كل الفصول"],
 "Method and sources": ["Método y fuentes","Método e fontes","Méthode et sources","المنهج والمصادر"],
 "Read everything on one page": ["Leer todo en una página","Ler tudo numa página","Tout lire sur une page","اقرأ كل شيء في صفحة واحدة"],
 "Start from the beginning": ["Empezar desde el principio","Começar do início","Commencer au début","ابدأ من البداية"],
 "Study companions": ["Complementos de estudio","Complementos de estudo","Compléments d’étude","مرافقات الدراسة"],
 "Yours": ["Lo tuyo","Seus itens","Vos éléments","الخاص بك"], "Time": ["Tiempo","Tempo","Temps","الزمن"],
 "People and places": ["Personas y lugares","Pessoas e lugares","Personnes et lieux","أشخاص وأماكن"],
 "Councils and doctrine": ["Concilios y doctrina","Concílios e doutrina","Conciles et doctrine","المجامع والعقيدة"],
 "Texts and sources": ["Textos y fuentes","Textos e fontes","Textes et sources","النصوص والمصادر"],
 "Pictures": ["Imágenes","Imagens","Images","الصور"], "Bible companions": ["Complementos bíblicos","Complementos bíblicos","Compléments bibliques","مرافقات الكتاب المقدس"],
 "More": ["Más","Mais","Plus","المزيد"],
 "Evidence deleted": ["Prueba eliminada","Evidência excluída","Élément supprimé","حُذف الدليل"],
 "Study deleted": ["Estudio eliminado","Estudo excluído","Étude supprimée","حُذفت الدراسة"],
 "Study imported": ["Estudio importado","Estudo importado","Étude importée","استُوردت الدراسة"],
 "Name of the new study": ["Nombre del nuevo estudio","Nome do novo estudo","Nom de la nouvelle étude","اسم الدراسة الجديدة"],
 "Both sides": ["Ambas posturas","Ambos os lados","Les deux positions","الجانبان"],
 "Unanswered": ["Sin respuesta","Sem resposta","Sans réponse","بلا رد"],
 "Threads": ["Hilos","Discussões","Fils","السلاسل"],
 "Answer this": ["Responder","Responder","Répondre","الرد على هذا"],
 "This answers (optional)": ["Responde a (opcional)","Responde a (opcional)","Répond à (facultatif)","يرد على (اختياري)"],
 "Nothing (a new point)": ["Nada (un punto nuevo)","Nada (um ponto novo)","Rien (un nouveau point)","لا شيء (نقطة جديدة)"],
}
i = s.index('var T = {'); j = s.index('\n};', i); T = s[i:j]
add = [(k, v) for k, v in TR.items() if '"%s":' % k not in T]
if add:
    import json
    line = '\n' + ', '.join('%s:%s' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False)) for k, v in add) + ','
    s = s[:i + len('var T = {')] + line + s[i + len('var T = {'):]
print('  %-30s %d added' % ('translations', len(add)))
SC = ', .ed21-nav, .ed21-tabs, .ed21-acts, .ed21-h, .ed21-sh, .ed21-ptools, .ed21-ph, .ed21-fld > label, .ed21-types, .ed21-dact, .st-acts, .st-kind, .st-back, .st-add, .st-lab, .ed21-addv, .ed21-addf, .ed21-addvs, .ed21-adddoc, .co-act, #series > .eyebrow, #series > h2, #library > .eyebrow, #studies > .eyebrow, #studies > h2'
once('var SCOPE = ".tabbar, ', 'var SCOPE = ".tabbar' + SC + ', ', 'translation scope')

# 6. the layer
css = open(os.path.join(ROOT, 'tools', 'v21.css'), encoding='utf-8').read()
js = open(os.path.join(ROOT, 'tools', 'v21.js'), encoding='utf-8').read()
block = '<style id="ed21">\n' + css + '</style>\n<script id="ed21js">\n' + js + '</script>\n'
s = re.sub(r'<style id="ed21">.*?</style>\n<script id="ed21js">.*?</script>\n', '', s, flags=re.S)
k = s.rindex('</body>')
s = s[:k] + block + s[k:]
open(PAGE, 'w', encoding='utf-8').write(s)
print('  size %d -> %d characters' % (n0, len(s)))
