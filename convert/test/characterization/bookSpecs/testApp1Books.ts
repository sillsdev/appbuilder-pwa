import { PkBookSpec } from 'convertBooks';

export const testApp1Books: PkBookSpec[] = [
    {
        lang: 'eng',
        abbr: 'C01',
        contentType: 'usfm',
        content:
            '\\id MAT\n' +
            '\n' +
            '\\ide UTF-8\n' +
            '\\h Matthew\n' +
            '\\toc1 The Good News According to Matthew\n' +
            '\\toc2 Matthew\n' +
            '\\toc3 Mat\n' +
            '\\mt2 The Good News According to\n' +
            '\\mt1 Matthew\n' +
            '\\c 1\n' +
            '\\p\n' +
            '\\v 1 The book of the genealogy of Jesus Christ,\\f + \\fr 1:1  \\ft Messiah (Hebrew) and Christ (Greek) both mean “Anointed One”\\f* the son of David, the son of Abraham.\n' +
            '\\v 2 Abraham became the father of Isaac. Isaac became the father of Jacob. Jacob became the father of Judah and his brothers.\n' +
            '\\v 3 Judah became the father of Perez and Zerah by Tamar. Perez became the father of Hezron. Hezron became the father of Ram.\n' +
            '\\v 4 Ram became the father of Amminadab. Amminadab became the father of Nahshon. Nahshon became the father of Salmon.\n',
        section: 'Gospel',
        testament: 'NT'
    },
    {
        lang: 'eng',
        abbr: 'C01',
        contentType: 'usfm',
        content:
            '\\id MRK\n' +
            '\n' +
            '\\ide UTF-8\n' +
            '\\h Mark\n' +
            '\\toc1 The Good News According to Mark\n' +
            '\\toc2 Mark\n' +
            '\\toc3 Mrk\n' +
            '\\mt2 The Good News According to\n' +
            '\\mt1 Mark\n' +
            '\\c 1\n' +
            '\\p\n' +
            '\\v 1 The beginning of the Good News of Jesus Christ, the Son of God.\n' +
            '\\v 2 As it is written in the prophets,\n' +
            '\\q1 “Behold,\\f + \\fr 1:2  \\ft “Behold”, from “ἰδοὺ”, means look at, take notice, observe, see, or gaze at. It is often used as an interjection.\\f* I send my messenger before your face,\n' +
            '\\q2 who will prepare your way before you:\\x + \\xo 1:2  \\xt Malachi 3:1\\x*\n' +
            '\\q1\n' +
            '\\v 3 the voice of one crying in the wilderness,\n' +
            '\\q2 ‘Make ready the way of the Lord!\n' +
            '\\q2 Make his paths straight!’”\\x + \\xo 1:3  \\xt Isaiah 40:3\\x*\n' +
            '\\p\n' +
            '\\v 4 John came baptizing\\f + \\fr 1:4  \\ft or, immersing\\f* in the wilderness and preaching the baptism of repentance for forgiveness of sins.\n' +
            '\\v 5 All the country of Judea and all those of Jerusalem went out to him. They were baptized by him in the Jordan river, confessing their sins. \\c 2\n' +
            '\\p\n' +
            '\\v 1 When he entered again into Capernaum after some days, it was heard that he was in the house.\n' +
            '\\v 2 Immediately many were gathered together, so that there was no more room, not even around the door; and he spoke the word to them.',
        section: 'Gospel',
        testament: 'NT'
    },
    {
        lang: 'grc',
        abbr: 'C02',
        contentType: 'usfm',
        content:
            '\\id JHN\n' +
            '\\h John\n' +
            '\\toc1 ΕΥΑΓΓΕΛΙΟΝ ΚΑΤΑ ΙΩΑΝΝΗΝ\n' +
            '\\toc2 ΚΑΤΑ ΙΩΑΝΝΗΝ\n' +
            '\\toc3 ΚΑΤΑ ΙΩΑΝΝΗΝ\n' +
            '\\mt1 ΕΥΑΓΓΕΛΙΟΝ ΚΑΤΑ ΙΩΑΝΝΗΝ\n' +
            '\n' +
            '\\c 1\n' +
            '\\ms Prologue\n' +
            '\\m\n' +
            '\\v 1 Ἐν ἀρχῇ ἦν ὁ Λόγος, καὶ ὁ Λόγος ἦν πρὸς τὸν Θεόν, καὶ Θεὸς ἦν ὁ Λόγος.\n' +
            '\\v 2 Οὗτος ἦν ἐν ἀρχῇ πρὸς τὸν Θεόν.\n' +
            '\\v 3 Πάντα δι᾿ αὐτοῦ ἐγένετο, καὶ χωρὶς αὐτοῦ ἐγένετο οὐδὲ ἓν ὃ γέγονεν.\n' +
            '\\v 4 Ἐν αὐτῷ ζωὴ ἦν, καὶ ἡ ζωὴ ἦν τὸ φῶς τῶν ἀνθρώπων.\n' +
            '\\v 5 Καὶ τὸ φῶς ἐν τῇ σκοτίᾳ φαίνει, καὶ ἡ σκοτία αὐτὸ οὐ κατέλαβεν.\n' +
            '\n' +
            '\\s1 John—a witness to the Light\n' +
            '\\p\n' +
            '\\v 6 Ἐγένετο ἄνθρωπος ἀπεσταλμένος παρὰ Θεοῦ, ὄνομα αὐτῷ Ἰωάννης.\n' +
            '\\v 7 Οὗτος ἦλθεν εἰς μαρτυρίαν, ἵνα μαρτυρήσῃ περὶ τοῦ φωτός, ἵνα πάντες πιστεύσωσιν δι᾿ αὐτοῦ.\n' +
            '\\v 8 Οὐκ ἦν ἐκεῖνος τὸ φῶς ἀλλ᾿ ἵνα μαρτυρήσῃ περὶ τοῦ φωτός.\n' +
            '\\v 9 Ἦν τὸ φῶς τὸ ἀληθινὸν ὃ φωτίζει πάντα ἄνθρωπον ἐρχόμενον εἰς τὸν κόσμον.\n' +
            '\\v 10 Ἐν τῷ κόσμῳ ἦν, καὶ ὁ κόσμος δι᾿ αὐτοῦ ἐγένετο, καὶ ὁ κόσμος αὐτὸν οὐκ ἔγνω.',
        section: 'Gospel',
        testament: 'NT'
    }
];
