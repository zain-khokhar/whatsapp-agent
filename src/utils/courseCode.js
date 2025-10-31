// List of all valid course codes as a Set for fast lookup
const courseCodes = new Set([
	'cs101', 'cs201', 'cs202', 'cs205', 'cs206', 'cs301', 'cs302', 'cs304', 'cs306', 'cs310', 'cs311', 'cs312', 'cs314', 'cs315', 'cs401', 'cs402', 'cs403', 'cs405', 'cs406', 'cs407', 'cs408', 'cs409', 'cs410', 'cs411', 'cs420', 'cs431', 'cs432', 'cs435', 'cs441', 'cs442', 'cs501', 'cs502', 'cs504', 'cs505', 'cs506', 'cs507', 'cs508', 'cs510', 'cs511', 'cs512', 'cs513', 'cs515', 'cs519', 'cs521', 'cs525', 'cs601', 'cs602', 'cs603', 'cs604', 'cs605', 'cs606', 'cs607', 'cs608', 'cs609', 'cs610', 'cs611', 'cs614', 'cs615', 'cs619', 'cs620', 'cs621', 'cs626', 'cs627', 'cs628', 'cs630', 'cs631', 'cs701', 'cs702', 'cs703', 'cs704', 'cs706', 'cs707', 'cs708', 'cs709', 'cs710', 'cs711', 'cs712', 'cs713', 'cs716', 'cs718', 'cs719', 'cs720', 'cs721', 'cs723', 'cs724', 'cs725', 'cs726',
    'mgt101', 'mgt111', 'mgt201', 'mgt211', 'mgt301', 'mgt401', 'mgt402', 'mgt404', 'mgt411', 'mgt501', 'mgt502', 'mgt503', 'mgt504', 'mgt510', 'mgt513', 'mgt520', 'mgt522', 'mgt601', 'mgt602', 'mgt603', 'mgt604', 'mgt610', 'mgt611', 'mgt612', 'mgt613', 'mgt614', 'mgt615', 'mgt617', 'mgt621', 'mgt622', 'mgt623', 'mgt625', 'mgt627', 'mgt628', 'mgt629', 'mgt630', 'mgt631', 'mgt703', 'mgt705', 'mgt715', 'mgt727', 'mgt731',
    'mth001', 'mth100', 'mth101', 'mth102', 'mth104', 'mth201', 'mth202', 'mth301', 'mth302', 'mth303', 'mth401', 'mth501', 'mth5101', 'mth5102', 'mth5103', 'mth5204', 'mth5205', 'mth5206', 'mth5207', 'mth5208', 'mth5209', 'mth5210', 'mth5211', 'mth601', 'mth603', 'mth600a', 'mth600b', 'mth621', 'mth622', 'mth631', 'mth632', 'mth633', 'mth634', 'mth641', 'mth642', 'mth643', 'mth644', 'mth645', 'mth646', 'mth647', 'mth701', 'mth704', 'mth706', 'mth707', 'mth712', 'mth718', 'mth720', 'mth721',
    'edu101', 'edu201', 'edu301', 'edu302', 'edu303', 'edu304', 'edu305', 'edu401', 'edu402', 'edu403', 'edu405', 'edu406', 'edu407', 'edu410', 'edu411', 'edu430', 'edu431', 'edu433', 'edu501', 'edu510', 'edu512', 'edu515', 'edu516', 'edu601', 'edu602', 'edu604', 'edu630', 'edu654',
    'mcm101', 'mcm301', 'mcm304', 'mcm310', 'mcm311', 'mcm401', 'mcm411', 'mcm431', 'mcm501', 'mcm511', 'mcm512', 'mcm514', 'mcm515', 'mcm516', 'mcm517', 'mcm520', 'mcm531', 'mcm532', 'mcm601', 'mcm604', 'mcm610', 'mcm611', 'mcm619', 'mcm499',
    'eco302', 'eco303', 'eco401', 'eco402', 'eco403', 'eco404', 'eco499', 'eco501', 'eco601', 'eco603', 'eco604', 'eco605', 'eco606', 'eco607', 'eco608', 'eco609', 'eco610', 'eco612', 'eco613', 'eco614', 'eco615', 'eco616', 'eco619', 'eco622',
    'eng001', 'eng101', 'eng201', 'eng301', 'eng401', 'eng498', 'eng499', 'eng501', 'eng502', 'eng503', 'eng504', 'eng505', 'eng506', 'eng507', 'eng508', 'eng509', 'eng510', 'eng511', 'eng512', 'eng513', 'eng514', 'eng515', 'eng516', 'eng517', 'eng518', 'eng519', 'eng520', 'eng521', 'eng522', 'eng523', 'eng524', 'eng527', 'eng529',
    'acc101', 'acc311', 'acc501',
    'sta100', 'sta301', 'sta408', 'sta5102', 'sta620', 'sta621', 'sta630', 'sta631', 'sta632', 'sta641', 'sta642', 'sta643', 'sta644', 'sta730',
    'isl101', 'isl201', 'isl202', 'isl301',
    'eth101', 'eth201', 'eth202', 'eth301',
    'pak101', 'pak301', 'pak302', 'pak417',
    'soc101', 'soc301', 'soc302', 'soc401', 'soc402', 'soc403', 'soc404', 'soc601', 'soc602', 'soc603', 'soc607', 'soc608', 'soc609', 'soc612', 'soc614',
    'psy101', 'psy201', 'psy301', 'psy401', 'psy402', 'psy403', 'psy404', 'psy405', 'psy406', 'psy408', 'psy409', 'psy502', 'psy504', 'psy516', 'psy601', 'psy610', 'psy619', 'psy631', 'psy632',
    'ece101', 'ece201', 'ece202', 'ece203', 'ece301', 'ece302', 'ece303', 'ece401', 'ece402', 'ece403', 'ece501', 'ece601',
    'edua305', 'edua402', 'edua403', 'edua405', 'edua406', 'edua430', 'edua501', 'edua510', 'edua516', 'edua519', 'edua601', 'edua602', 'edua630',
    


]);

module.exports = courseCodes;
