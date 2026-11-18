# -*- coding: utf-8 -*-
"""Dates for the Fathers' commentary: when a work was written (where well established), else the author's lifetime."""
import re
LIFE = {
 'Augustine of Hippo': '354–430', 'John Chrysostom': 'c. 347–407', 'Jerome': 'c. 347–420', 'Origen of Alexandria': 'c. 185–253', 'Tertullian': 'c. 155–220',
 'Cyril of Alexandria': 'c. 376–444', 'Ambrose of Milan': 'c. 339–397', 'Hilary of Poitiers': 'c. 310–367', 'Gregory the Dialogist': 'c. 540–604', 'Bede': '673–735',
 'Theophylact of Ohrid': 'c. 1055–1107', 'Remigius of Rheims': 'c. 437–533', 'Rabanus Maurus': 'c. 780–856', 'Alcuin of York': 'c. 735–804', 'Basil of Caesarea': 'c. 330–379',
 'Titus of Bostra': 'd. c. 378', 'Eusebius of Caesarea': 'c. 260–339', 'Gregory of Nyssa': 'c. 335–395', 'Athanasius of Alexandria': 'c. 296–373', 'Gregory of Nazianzus': '329–390',
 'Irenaeus': 'c. 130–202', 'Clement of Alexandria': 'c. 150–215', 'Cyprian': 'c. 210–258', 'Hippolytus of Rome': 'c. 170–235', 'John Cassian': 'c. 360–435', 'Ephrem the Syrian': 'c. 306–373',
 'Leo the Great': 'c. 400–461', 'Cyril of Jerusalem': 'c. 313–386', 'Justin Martyr': 'c. 100–165', 'Ignatius of Antioch': 'd. c. 110', 'Polycarp of Smyrna': 'c. 69–155', 'Theodoret of Cyrus': 'c. 393–458',
 'Aphrahat the Persian Sage': 'c. 270–345', 'Lactantius': 'c. 250–325', 'Methodius of Olympus': 'd. c. 311', 'Novatian': 'c. 200–258', 'John Damascene': 'c. 675–749',
 'Pseudo-Chrysostom': '5th–6th century', 'Glossa Ordinaria': '12th century', 'Pseudo-Jerome': 'date uncertain', 'Ancient Greek Expositor': 'date uncertain', 'Apostolic Constitutions': 'c. 375–380',
 'Shepherd of Hermas': '2nd century', 'Oecumenius': '6th century', 'Clement of Rome': 'c. 96', 'Theophilus of Antioch': 'd. c. 183', 'Athenagoras': 'c. 177', 'Arnobius': 'd. c. 330',
 'Victorinus of Pettau': 'd. 304', 'Gregory Thaumaturgus': 'c. 213–270', 'Dionysius of Alexandria': 'd. 265', 'Commodianus': '3rd century', 'Minucius Felix': 'c. 200', 'Mathetes': '2nd century',
 'Tatian': 'c. 120–180', 'Peter of Alexandria': 'd. 311', 'Alexander of Alexandria': 'd. 328', 'Julius Africanus': 'c. 160–240', 'Anatolius': 'd. 283', 'Pamphilus': 'd. 309',
 'Sulpitius Severus': 'c. 363–425', 'Rufinus of Aquileia': 'c. 345–411', 'Vincent of Lerins': 'd. c. 445', 'Socrates Scholasticus': 'c. 380–440', 'Sozomen': 'c. 400–450',
 'Thomas Aquinas': '1225–1274', 'Archelaus': '4th century', 'Barnabas': 'c. 100', 'Pseudo-Ignatius': '4th century', 'Pseudo-Clement': '3rd–4th century', 'Peter Chrysologus': 'c. 380–450', 'Maximus the Confessor': 'c. 580–662', 'Haymo of Halberstadt': 'd. 853', 'Isidore of Pelusium': 'd. c. 450', 'Didymus the Blind': 'c. 313–398', 'Ambrosiaster': '4th century', 'Epiphanius of Salamis': 'c. 315–403', 'Theodotus of Ancyra': 'd. c. 446', 'Pseudo-Augustine': 'date uncertain', 'Pseudo-Origen': 'date uncertain', 'Severus of Antioch': 'c. 465–538', 'Victor of Antioch': '5th century', 'Isidore of Seville': 'c. 560–636', 'Anselm of Canterbury': '1033–1109', 'Fulgentius of Ruspe': 'c. 462–533', 'Chromatius of Aquileia': 'd. c. 407', 'Maximus of Turin': 'd. c. 420', 'Gennadius of Constantinople': 'd. 471', 'Eusebius of Emesa': 'c. 300–359', 'Severian of Gabala': 'd. after 408', 'Paschasius Radbertus': 'c. 785–865', 'Gregory Palamas': '1296–1359', 'Vigilius of Thapsus': 'fl. c. 484', 'Josephus': 'c. 37–100', 'Nemesius of Emesa': 'fl. c. 390', 'Pseudo-Dionysius the Areopagite': 'c. 500'}
WORK = [
 ('John Chrysostom', r'Homil.*Matthew', 'c. 390'), ('John Chrysostom', r'Homil.*John', 'c. 391'), ('John Chrysostom', r'Homil.*Acts', 'c. 400'),
 ('John Chrysostom', r'Homil.*Romans', 'c. 391'), ('John Chrysostom', r'Homil.*Corinthians', 'c. 392'), ('John Chrysostom', r'Galatians', 'c. 395'),
 ('John Chrysostom', r'Homil.*(Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon)', 'c. 390–402'), ('John Chrysostom', r'Homil.*Hebrews', 'c. 403'),
 ('John Chrysostom', r'Statues', '387'), ('John Chrysostom', r'Priesthood', 'c. 386'),
 ('Augustine of Hippo', r'Tractate', '406–420'), ('Augustine of Hippo', r'Exposition on (the )?Psalm', '392–422'), ('Augustine of Hippo', r'City of God', '413–426'),
 ('Augustine of Hippo', r'Confessions', 'c. 397–400'), ('Augustine of Hippo', r'On the (Holy )?Trinity', '400–420'), ('Augustine of Hippo', r'Sermon on the Mount', '393–394'),
 ('Augustine of Hippo', r'Epistle of John|First Epistle of John', '407'), ('Augustine of Hippo', r'Christian Doctrine', '397–426'), ('Augustine of Hippo', r'Enchiridion', 'c. 421'),
 ('Augustine of Hippo', r'Harmony of the Gospels', 'c. 400'), ('Augustine of Hippo', r'Spirit and the Letter', '412'), ('Augustine of Hippo', r'Nature and Grace', '415'),
 ('Jerome', r'Jovinian', '393'), ('Jerome', r'Vigilantius', '406'), ('Jerome', r'Helvidius|Perpetual Virginity', 'c. 383'), ('Jerome', r'Illustrious Men|Lives', '392'),
 ('Jerome', r'Pelagian', '415'), ('Jerome', r'Apology', '401–402'),
 ('Origen of Alexandria', r'Gospel of John', 'c. 231–248'), ('Origen of Alexandria', r'Matthew', 'c. 246–249'), ('Origen of Alexandria', r'Celsus', 'c. 248'),
 ('Origen of Alexandria', r'Principiis|First Principles', 'c. 220–230'),
 ('Tertullian', r'Marcion', 'c. 207–208'), ('Tertullian', r'Praxeas', 'c. 213'), ('Tertullian', r'Prescription', 'c. 200'), ('Tertullian', r'Apology', '197'),
 ('Tertullian', r'Baptism', 'c. 200–206'), ('Tertullian', r'Prayer', 'c. 198–204'), ('Tertullian', r'Modesty', 'c. 210–220'), ('Tertullian', r'Monogamy', 'c. 208–212'),
 ('Tertullian', r'Fasting', 'c. 210–220'), ('Tertullian', r'Idolatry', 'c. 200–206'), ('Tertullian', r'Soul', 'c. 210–213'), ('Tertullian', r'Flesh of Christ', 'c. 206–212'),
 ('Tertullian', r'Resurrection', 'c. 208–212'), ('Tertullian', r'Jews', 'c. 200'), ('Tertullian', r'Patience', 'c. 200–203'), ('Tertullian', r'Repentance', 'c. 203'),
 ('Tertullian', r'Veiling', 'c. 207'), ('Tertullian', r'Chaplet|Crown', '211'), ('Tertullian', r'Scorpiace', 'c. 213'), ('Tertullian', r'Shows|Spectacles', 'c. 197–202'),
 ('Irenaeus', r'Heresies', 'c. 180'), ('Irenaeus', r'Demonstration', 'c. 190'),
 ('Cyril of Alexandria', r'John', 'c. 425–428'), ('Cyril of Alexandria', r'Luke', 'c. 430'),
 ('Clement of Alexandria', r'Instructor', 'c. 195'), ('Clement of Alexandria', r'Stromata', 'c. 198–203'), ('Clement of Alexandria', r'Exhortation', 'c. 195'), ('Clement of Alexandria', r'Rich Man', 'c. 200'),
 ('Cyprian', r'Testimonies', 'c. 248'), ('Cyprian', r'Unity', '251'), ('Cyprian', r"Lord.s Prayer", 'c. 252'), ('Cyprian', r'Lapsed', '251'), ('Cyprian', r'Mortality', '252'),
 ('Hilary of Poitiers', r'Trinity', '356–360'),
 ('Athanasius of Alexandria', r'Incarnation', 'c. 318–335'), ('Athanasius of Alexandria', r'Arians', 'c. 339–359'), ('Athanasius of Alexandria', r'Antony', 'c. 360'),
 ('Basil of Caesarea', r'Hexaemeron', 'c. 378'), ('Basil of Caesarea', r'Holy Spirit|Spiritu', 'c. 375'),
 ('Gregory the Dialogist', r'Moral', '579–595'), ('Gregory the Dialogist', r'Pastoral', 'c. 590'), ('Gregory the Dialogist', r'Dialogues', '593–594'),
 ('John Cassian', r'Institutes', 'c. 420'), ('John Cassian', r'Conference', 'c. 426–429'),
 ('Hippolytus of Rome', r'Refutation', 'c. 225'), ('Hippolytus of Rome', r'Antichrist', 'c. 200'),
 ('Justin Martyr', r'First Apology', 'c. 155'), ('Justin Martyr', r'Trypho', 'c. 160'), ('Justin Martyr', r'Second Apology', 'c. 160'),
 ('Eusebius of Caesarea', r'Church History|Ecclesiastical History', 'c. 313–325'), ('Eusebius of Caesarea', r'Demonstrat|Proof of the Gospel', 'c. 314–318'),
 ('Cyril of Jerusalem', r'Catechetical|Lecture', 'c. 350'), ('Gregory of Nyssa', r'Catechetical|Great Catechism', 'c. 385'), ('Gregory of Nyssa', r'Eunomius', '380–383'),
 ('Gregory of Nazianzus', r'Oration', '379–381'), ('Lactantius', r'Divine Institutes', 'c. 303–311'), ('Aphrahat the Persian Sage', r'Demonstration', '337–345'),
 ('John Damascene', r'Orthodox Faith', 'c. 743'), ('Theodoret of Cyrus', r'Ecclesiastical History', 'c. 450'), ('Leo the Great', r'Tome|Letter XXVIII', '449'),
 ('Ignatius of Antioch', r'^(?!.*Pseudo)', 'c. 110'), ('Polycarp of Smyrna', r'Philippians', 'c. 110–140'), ('Apostolic Constitutions', r'.', 'c. 375–380'),
]
def date_for(author, title):
    """Returns (label, kind): kind 'w' = date of this work, 'l' = the author's lifetime."""
    if 'Catena Aurea' not in title:
        for a, rx, d in WORK:
            if a == author and re.search(rx, title, re.I): return d, 'w'
    if re.search(r'Pseudo-Ignatius', title): return LIFE['Pseudo-Ignatius'], 'l'
    return LIFE.get(author, ''), 'l'
