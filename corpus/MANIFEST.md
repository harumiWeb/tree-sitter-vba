# VB6 corpus manifest

Acceptance corpus for the tree-sitter VB6 grammar: real Visual Basic 6 source pulled from public GitHub repositories, copied byte for byte (no re-encoding, no line-ending changes; most files are Windows-1252 with CRLF, some upstream repos normalise to LF via `.gitattributes`). Collected 2026-09-08 from shallow clones at the commits listed below.

Selection rules:

- Only `.bas`, `.cls`, `.frm` and `.ctl` files. `.frx`, `.vbp`, `.vbw`, `.dsr`, `.pag`, `.res` and binaries are not copied.
- A file is accepted only if it carries the VB6 signature: `.frm` and `.ctl` start with `VERSION 5.00` followed by `Begin VB.Form`, `Begin VB.MDIForm` or `Begin VB.UserControl` (VBA UserForms with a `Begin {GUID}` header are rejected); `.cls` starts with `VERSION 1.0 CLASS` and `BEGIN`; `.bas` starts with `Attribute VB_Name =`. Files that use `PtrSafe`, `LongPtr` or `#If VBA7` are dropped as VBA or twinBASIC compatible sources, with the drop count in Notes.
- Every project has a `.vbp` project file in the clone. Repositories that are twinBASIC only (`.twinproj` without `.vbp`) are excluded.
- Only repositories with a licence file in the clone are copied; the licence text is stored verbatim as `LICENSE` in each project folder. Permissive licences are preferred; copyleft projects are flagged in the Copyleft column and were kept for pre-2000 coverage.
- Each project is capped at 40 files. When a project exceeds the cap, files are picked round-robin by extension with weights .ctl 1, .frm 2, .cls 1, .bas 1, in sorted path order, so every kind of source stays represented.
- No more than six projects per GitHub account.
- Paths inside each project folder are the paths in the upstream repository. Folder names are `<owner>__<repo>`.

## Projects

| Project | URL | Commit SHA (full) | Licence | Copyleft | .bas | .cls | .frm | .ctl | Era evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| wqweto__VbAsyncSocket | https://github.com/wqweto/VbAsyncSocket | 4e363c3e5345eeb32a79882c0ba676f996d53e88 | MIT |  | 10 | 12 | 16 | 1 |  | dropped 1 file(s) using PtrSafe/LongPtr/VBA7 |
| wqweto__ZipArchive | https://github.com/wqweto/ZipArchive | 3586edb5910a10338a397d11c6a1cb5c7da7007e | MIT-0 |  | 2 | 4 | 2 | 0 |  | dropped 1 file(s) using PtrSafe/LongPtr/VBA7 |
| wqweto__VbQRCodegen | https://github.com/wqweto/VbQRCodegen | 61f26c63da198e40b1b3f65176c6eb7fa31b116a | MIT-0 |  | 0 | 0 | 1 | 0 |  | dropped 1 file(s) using PtrSafe/LongPtr/VBA7 |
| wqweto__VbVncServer | https://github.com/wqweto/VbVncServer | 6d165bea43db2a76b7f68bb6b3be64dc9c9bb473 | MIT |  | 1 | 1 | 2 | 0 |  |  |
| wqweto__VBD3D11 | https://github.com/wqweto/VBD3D11 | d894f3ebd165761af85da1edf1463500fb2bac96 | MIT |  | 8 | 0 | 10 | 0 |  | Direct3D 11 samples |
| wqweto__NinePatch | https://github.com/wqweto/NinePatch | 993acdf19dbe85dcf538aa5aedcc355a51c8b0ee | MIT |  | 6 | 2 | 3 | 3 |  | user controls |
| Kr00l__VBCCR | https://github.com/Kr00l/VBCCR | 0b16379ceaafd5f26410496c479e54cfe344996b | MIT |  | 0 | 6 | 3 | 0 |  | Common Controls Replacement; most sources carry #If VBA7 blocks and were dropped; dropped 152 file(s) using PtrSafe/LongPtr/VBA7 |
| Kr00l__VBFLXGRD | https://github.com/Kr00l/VBFLXGRD | 5e1455c5f0fecfccb7ffbb938b918eb5683753a9 | MIT |  | 0 | 4 | 1 | 0 |  | FlexGrid control; VBA7-guarded sources dropped; dropped 13 file(s) using PtrSafe/LongPtr/VBA7 |
| kellyethridge__VBCorLib | https://github.com/kellyethridge/VBCorLib | 100acbbae0c072132267ec01c7aed808ff606e25 | MIT |  | 12 | 13 | 15 | 0 |  | class library; capped; 655 eligible, capped at 40 |
| cdhigh__Vb6Tkinter | https://github.com/cdhigh/Vb6Tkinter | 0805a6ad2005b748d94b5c9daf87e6446796fe1d | MIT |  | 8 | 24 | 6 | 2 |  | IDE add-in; user controls; capped; 44 eligible, capped at 40 |
| fafalone__RunAsTrustedInstaller | https://github.com/fafalone/RunAsTrustedInstaller | 6e500b58d1c4ef62d31d23437ef0c27ece6ed3e1 | MIT |  | 1 | 0 | 1 | 0 |  | repo also carries a twinBASIC project; only the VB6 .vbp sources taken |
| fafalone__D2DSamples | https://github.com/fafalone/D2DSamples | 80eec1b2f1080bdec0c9e8654be5329c23b7a33c | MIT |  | 5 | 9 | 14 | 0 |  | Direct2D samples; twinBASIC twins dropped; dropped 38 file(s) using PtrSafe/LongPtr/VBA7 |
| fafalone__ShellControls | https://github.com/fafalone/ShellControls | 2df0279aaa006fc07783c850add0596adf659a4f | MIT |  | 0 | 0 | 13 | 2 |  | user controls; twinBASIC twins dropped |
| fafalone__Lems64 | https://github.com/fafalone/Lems64 | f9843d363c137bdbb7a68e5c7f3bc1e4737a4c4c | CC0-1.0 |  | 28 | 3 | 3 | 6 |  | user controls; VB6 folder; twinBASIC and LongPtr files dropped; capped; dropped 32 file(s) using PtrSafe/LongPtr/VBA7; 45 eligible, capped at 40 |
| Unicontsoft__UcsFiscalPrinters | https://github.com/Unicontsoft/UcsFiscalPrinters | 926885259010cde37f8fca5e11333b9e45fee99b | MIT |  | 8 | 24 | 6 | 2 |  | business app; user controls; capped; dropped 2 file(s) using PtrSafe/LongPtr/VBA7; 42 eligible, capped at 40 |
| Sibra-Soft__audiostation | https://github.com/Sibra-Soft/audiostation | 8dcf55f3cb9783cb17224bee6853a8ab50bfc5c0 | MIT |  | 8 | 7 | 14 | 4 |  | media player; user controls |
| EduardoVB__NewTab | https://github.com/EduardoVB/NewTab | 5fc9f4f080f13a4b8a456688cf5711cb7dac699f | MIT-0 |  | 1 | 5 | 18 | 0 |  | tab control; 12 VBA7-guarded files dropped; dropped 12 file(s) using PtrSafe/LongPtr/VBA7 |
| EduardoVB__ColorControls | https://github.com/EduardoVB/ColorControls | 0811d04f9ed6ce40363ca6988d989061904216ed | MIT-0 |  | 11 | 10 | 10 | 9 | mBSSubclass.bas: "Date: 25 June 1998", Steve McMahon for vbAccelerator | user controls |
| EduardoVB__ComponentDocumenter | https://github.com/EduardoVB/ComponentDocumenter | c0660786665f9fde5f53816f079fd08124333ae1 | MIT-0 |  | 3 | 2 | 16 | 0 |  | IDE add-in |
| EduardoVB__DrawingControls | https://github.com/EduardoVB/DrawingControls | 28f0b612c2537e6a8594d9c6a6e630ff84880321 | MIT-0 |  | 3 | 4 | 4 | 2 | mBSSubclass.bas: "Date: 25 June 1998" | user controls |
| EduardoVB__SSTabEx | https://github.com/EduardoVB/SSTabEx | 7b22fd54fcdbce5229d5a4a1b78e4058e70692e6 | MIT-0 |  | 2 | 3 | 2 | 1 | mBSSubclass.bas: "Date: 25 June 1998" | user control |
| EduardoVB__ScrollableContainer | https://github.com/EduardoVB/ScrollableContainer | d9d07845374e2762a73601bd3e3346476e69ce12 | MIT-0 |  | 2 | 2 | 2 | 1 | cScrollBars.cls: "Date: 24 December 1998", "Copyright 1998 Steve McMahon (vbAccelerator)" | user control |
| opensoldat__polyworks | https://github.com/opensoldat/polyworks | 2ba5b0ec60545c47ab5205b9cb34b0f5ec0d3650 | MIT |  | 7 | 0 | 12 | 0 |  | Soldat map editor (game tooling) |
| Gagniuc__Binary-metamorphosis | https://github.com/Gagniuc/Binary-metamorphosis | 219ca435d32bd67dcea13e895f17ed2599cdbae4 | MIT |  | 0 | 3 | 4 | 0 | cCommonDialog.cls: "Date: 24 May 1998" (vbAccelerator) | science app |
| Gagniuc__Diabetes-prediction-2.0 | https://github.com/Gagniuc/Diabetes-prediction-2.0 | 0de2bd7fa274a914f2da1e8c603867c856b1bd49 | MIT |  | 2 | 0 | 2 | 0 |  | science app |
| Gagniuc__VB6-add-GUI-objects-at-runtime | https://github.com/Gagniuc/VB6-add-GUI-objects-at-runtime | f44273042a307317192ee7306daec1dabd74392b | MIT |  | 0 | 0 | 3 | 0 |  | sample |
| Gagniuc__Markov-Chains-The-weather | https://github.com/Gagniuc/Markov-Chains-The-weather | c0094dc3c6eb55db6b398b20e8b4d23fb01fb2fc | MIT |  | 1 | 0 | 1 | 0 |  | science app |
| Gagniuc__Visual-Sequence-Alignment-in-VB6 | https://github.com/Gagniuc/Visual-Sequence-Alignment-in-VB6 | 99b6b9c3b3ec75e78ff44722064b6e0637edafff | MIT |  | 0 | 0 | 1 | 0 |  | bioinformatics |
| Gagniuc__Prototype-software-for-Photon-pixel-coupling | https://github.com/Gagniuc/Prototype-software-for-Photon-pixel-coupling | c69de59958b67eab32287be88dddd5f7943d051a | MIT |  | 0 | 0 | 1 | 0 |  | science app |
| RZulu54__ChessBrainVB | https://github.com/RZulu54/ChessBrainVB | d2700ba4df47555f021e411ba736049ef73c219a | MIT |  | 11 | 0 | 2 | 0 |  | chess engine; 3 LongPtr files dropped; dropped 3 file(s) using PtrSafe/LongPtr/VBA7 |
| SailorSat__soft-15khz | https://github.com/SailorSat/soft-15khz | cc3411b0472ce342e3cd89fcee2f0961d0a73f9c | MIT |  | 12 | 0 | 10 | 0 |  | arcade video utility |
| SailorSat__isa-2-sega | https://github.com/SailorSat/isa-2-sega | 81518ff96193010851ce483ea9899a0509c055f4 | MIT |  | 2 | 2 | 1 | 0 |  | hardware utility |
| meyskens__mastodon-for-workgroups | https://github.com/meyskens/mastodon-for-workgroups | 5b86cccb8289f7c45f489939111cf3aee37ffd4c | Apache-2.0 |  | 3 | 0 | 3 | 1 |  | Win9x Mastodon client; user control; 1 LongPtr file dropped; dropped 1 file(s) using PtrSafe/LongPtr/VBA7 |
| tannerhelland__PhotoDemon | https://github.com/tannerhelland/PhotoDemon | 8357ce499191bf12b84091b936aa9424ac35022f | BSD-3-Clause |  | 8 | 8 | 16 | 8 |  | photo editor; 56 user controls in repo; capped; dropped 1 file(s) using PtrSafe/LongPtr/VBA7; 591 eligible, capped at 40 |
| tannerhelland__VBIDEUtils | https://github.com/tannerhelland/VBIDEUtils | 1747ebed55f4fdb15108b8d69d199cffe2ef16e3 | MIT |  | 8 | 8 | 16 | 8 | hundreds of headers "* Date : 04/11/1999" etc.; FunctionData.cls "Date : 15/12/1999" | IDE add-in (originally by Thierry69, 1999); user controls; capped; 161 eligible, capped at 40 |
| tannerhelland__vb6-code | https://github.com/tannerhelland/vb6-code | f2703861b9e6a7ed4acdc6eedb2632ca8903f895 | BSD-2-Clause |  | 7 | 11 | 22 | 0 |  | graphics samples; capped; 89 eligible, capped at 40 |
| rlktradewright__tradebuild-platform | https://github.com/rlktradewright/tradebuild-platform | 064fdc1f21ca03bc185b2ceb04cebca7818bfd28 | MIT |  | 8 | 8 | 16 | 8 |  | trading platform; user controls; capped; 814 eligible, capped at 40 |
| sdomi__awsom | https://github.com/sdomi/awsom | 1b69b1e485fdac39528c264016d87ad722077b7a | MIT |  | 0 | 2 | 4 | 1 |  | user control; 1 LongPtr file dropped; dropped 1 file(s) using PtrSafe/LongPtr/VBA7 |
| pyhoon__star-hotel-vb6 | https://github.com/pyhoon/star-hotel-vb6 | 563a1b5d48fc0b0274a62b875560f13eb3b8108b | MIT |  | 7 | 0 | 16 | 0 |  | business app |
| pyhoon__omelette-vb6 | https://github.com/pyhoon/omelette-vb6 | d327ef8a4a5c548a2494682d7189693fe0421922 | MIT |  | 8 | 2 | 21 | 0 |  | MDIForm; business app |
| mikechambers84__vbNES | https://github.com/mikechambers84/vbNES | ee33adc667b02610e7095c0ed7554466e985fbf7 | MIT |  | 14 | 0 | 4 | 0 |  | NES emulator |
| Zen-CODE__ZenKEY | https://github.com/Zen-CODE/ZenKEY | bbf06c3f7afc46cd70e5725d2d2bb69ef4f47173 | BSD-3-Clause |  | 10 | 10 | 20 | 0 |  | utility; capped; 67 eligible, capped at 40 |
| CoolWindValley__CoolWind2D-GameEngine-CHS | https://github.com/CoolWindValley/CoolWind2D-GameEngine-CHS | 004caf58caab785ff4307bdd246165d171d58020 | MIT |  | 1 | 0 | 15 | 1 |  | game engine; Chinese comments (GB2312 bytes) |
| jcfieldsdev__genesis-rom-utility | https://github.com/jcfieldsdev/genesis-rom-utility | 31826bca66c8c6c467c37c1b711943eb5464e7e8 | MIT |  | 3 | 0 | 2 | 0 |  | utility |
| floresroquejosue__Vb6NotifyIcon | https://github.com/floresroquejosue/Vb6NotifyIcon | 5d49df29d3ea4c6864126f24dcd15693045fe8cf | Unlicense |  | 0 | 1 | 3 | 1 |  | user control |
| floresroquejosue__Vb6IconCreator | https://github.com/floresroquejosue/Vb6IconCreator | 11912ad49e7bab952e04c5d3163463f467b845da | Unlicense |  | 2 | 3 | 4 | 1 |  | user control |
| blistik__FireflyKalidasa | https://github.com/blistik/FireflyKalidasa | 7454c2a721ded2e4fbac66ab4de1499aef3897d4 | Unlicense |  | 2 | 0 | 38 | 0 |  | MDIForm; board-game conversion; capped; 52 eligible, capped at 40 |
| happyqq__VideoConverter | https://github.com/happyqq/VideoConverter | 9ca3d938ace96e64c29c73250236e51ada1ae6f5 | MIT |  | 15 | 2 | 4 | 1 | modDialog.bas: "Created on: 11-17-1998" | utility; user control |
| udzk__Visual-Basic-6.0-MQTT-3.1.1 | https://github.com/udzk/Visual-Basic-6.0-MQTT-3.1.1 | 30b85072b3233623cfbe5134f7e7a04b83746951 | MIT |  | 0 | 0 | 1 | 0 |  | network library |
| MuTsunTsai__PlowColorIder | https://github.com/MuTsunTsai/PlowColorIder | 15c22d1d4f93450226edcaa4d5fd2b0e89b0a738 | MIT |  | 3 | 20 | 5 | 11 | LICENSE.md: "Copyright (c) 1999-2008 Mu-Tsun Tsai"; README: oldest files date to 1999 | colour tool; 11 user controls |
| KirillOsenkov__PolyhedronExplorerVB6 | https://github.com/KirillOsenkov/PolyhedronExplorerVB6 | a07a9635900c802d21e3815dc38a9890828370fa | MIT |  | 9 | 12 | 8 | 2 |  | MDIForm; user controls; 3D geometry |
| SweetIceLolly__SocketTester | https://github.com/SweetIceLolly/SocketTester | 4dacd2eee273f8d5624fad15b1666758dff2ff04 | MIT |  | 0 | 0 | 4 | 0 |  | MDIForm; network utility |
| lvcabral__ActivePack | https://github.com/lvcabral/ActivePack | 170d7661faca48cb5270668bd5a11e35f303c496 | MIT |  | 8 | 8 | 15 | 9 | LICENSE: "Copyright (c) 1998-2018 Marcelo Lv Cabral"; Animate.cls: "Copyright Karl E. Peterson, 1997 ... January 1998"; cScrollBars.cls: "Copyright 1998 Steve McMahon" | ActiveX control pack; user controls; capped; 52 eligible, capped at 40 |
| gauss77__oldschool-visualbasic6 | https://github.com/gauss77/oldschool-visualbasic6 | cbb3c920134a8d7faeeef97454b311cecd00982d | CC0-1.0 |  | 0 | 0 | 13 | 0 |  | student games and demos |
| code-blooded-developer__On-Screen-Key-Board | https://github.com/code-blooded-developer/On-Screen-Key-Board | 67dc6951e905b6086cbc3e6a4f72d667daaf2e8b | MIT |  | 0 | 0 | 3 | 0 |  | utility |
| mcvendrell__SimpleAgenda | https://github.com/mcvendrell/SimpleAgenda | de4642ac323caa6e1b1a675092660982fff7b6d3 | MIT |  | 2 | 0 | 7 | 0 |  | utility |
| huguesjohnson__powerups | https://github.com/huguesjohnson/powerups | e330a0a5e8471b3fe2ce867d4181d96534050245 | MIT |  | 4 | 0 | 4 | 0 |  | small games |
| junian__vb6-apps | https://github.com/junian/vb6-apps | 32e1f301222b47aae6fa60954b9a8f42943e6040 | MIT |  | 1 | 0 | 14 | 0 |  | MDIForm; assorted apps |
| MisterVector__BNET-to-IRC | https://github.com/MisterVector/BNET-to-IRC | fd31b2e497ecf9a89ff82155794582d101996374 | MIT |  | 14 | 2 | 3 | 0 |  | network utility |
| nithinmohantk__JewelBox-2004-Project | https://github.com/nithinmohantk/JewelBox-2004-Project | 9a9ee1d895ae9bc6d13b390cce5d5c70de9f0e35 | MIT |  | 5 | 0 | 35 | 0 |  | MDIForm; business app (2004); MySQL .frm table files rejected; capped; 57 eligible, capped at 40 |
| openmicroanalysis__calczaf | https://github.com/openmicroanalysis/calczaf | 6b93d143143d631ccca2d27d25a9c4cf6cc1c467 | MIT |  | 12 | 2 | 26 | 0 | every module: "(c) Copyright 1995-2026 by John J. Donovan" | scientific (microprobe); capped; 239 eligible, capped at 40 |
| ProffiCV__ccyberx | https://github.com/ProffiCV/ccyberx | f1a20192f0c83ad1301c38cbe12b4ff28b30faae | MIT |  | 12 | 2 | 26 | 0 |  | cyber-cafe app; capped; 59 eligible, capped at 40 |
| steveohara__stockticker | https://github.com/steveohara/stockticker | 253570235871ce0f2fb2fb8976620b6a888041b1 | Apache-2.0 |  | 5 | 6 | 6 | 0 |  | utility |
| RealityRipple__Random-BackGround | https://github.com/RealityRipple/Random-BackGround | 1c58f4570ee37d22ce0eb2e8800deb40d144f85e | Unlicense |  | 9 | 3 | 4 | 1 |  | utility; user control; 1 LongPtr file dropped; dropped 1 file(s) using PtrSafe/LongPtr/VBA7 |
| dotcomboom__AutoSite-98 | https://github.com/dotcomboom/AutoSite-98 | 21272d200014a5c4756e4b6cc59bdb65aa89f7c8 | Unlicense |  | 0 | 0 | 1 | 0 |  | single form |
| kroesner__swiftirc-client | https://github.com/kroesner/swiftirc-client | 4abfe192048612f2e189dc385d23b388b0061614 | MIT |  | 8 | 8 | 16 | 8 |  | IRC client; 27 user controls; README lists files outside the MIT grant, those are excluded here; capped; 143 eligible, capped at 40 |
| Planet-Source-Code__stewart-scintilla-vb-activex-control-update-1-2__1-63712 | https://github.com/Planet-Source-Code/stewart-scintilla-vb-activex-control-update-1-2__1-63712 | 5060d1d4702197d0b8bd7f1ad5718600a7bbe4e3 | GPL-2.0 | yes | 14 | 4 | 13 | 9 | modActive.bas, mIOIPAOTreeView.bas: "Date: 09 January 1999" (vbAccelerator); PSC re-upload | MDIForm; 9 user controls; Scintilla wrapper; capped; 47 eligible, capped at 40 |
| M2000Interpreter__Environment | https://github.com/M2000Interpreter/Environment | c7bb645bb7a0172ca3c859b22c603864c36edc0b | GPL-3.0 | yes | 8 | 8 | 16 | 8 | IsPrinter.bas: "KPD-Team 1999"; cRegistry.cls: "Date: 21 Feb 1997", "Updated 29 April 1998 for VB5" | interpreter; user controls; 2 LongPtr files dropped; capped; dropped 2 file(s) using PtrSafe/LongPtr/VBA7; 170 eligible, capped at 40 |
| AGenius__IRCDominator | https://github.com/AGenius/IRCDominator | 96b420881a5e25dfafb05498d082abf1041e4787 | GPL-3.0 | yes | 9 | 9 | 20 | 2 | frmSysTray.frm: "Copyright (c) 1997, Ben Baird"; WinReg32.bas: "Copyright 1998, 2000 Randy Mcdowell" | MDIForm; IRC client; user controls; capped; 63 eligible, capped at 40 |
| Axiomedes__AxGraphics-Controls-Set | https://github.com/Axiomedes/AxGraphics-Controls-Set | b631e299fba7b8339f633425ea5799597cad1ab6 | LGPL-2.1 | yes | 3 | 3 | 2 | 11 | mIOleInPlaceActivate.bas: "Date: 09 January 1999" (vbAccelerator) | MDIForm; 11 user controls |
| Planet-Source-Code__reexre-convert-pic-to-toon__1-71920 | https://github.com/Planet-Source-Code/reexre-convert-pic-to-toon__1-71920 | 2e09b06528e845230bb91e5a02da474d1b247354 | GPL-2.0 | yes | 6 | 1 | 2 | 0 | cDIB.cls: "created: 12/1999 by Ray Mercer", "Copyright (C) 1999 - 2000 Ray Mercer"; PSC re-upload | image filter |

## Totals

- Projects: 71 (66 permissive, 5 copyleft)
- Files: 1436 (.bas 382, .cls 283, .frm 647, .ctl 124)
- .frm files: 647; projects containing an MDIForm: 9; projects with .ctl user controls: 29
- Projects with pre-2000 evidence: 15
- Files dropped for PtrSafe / LongPtr / #If VBA7: 261 across 15 projects
- Distinct GitHub accounts: 46

## Found but excluded

No licence file in the clone, so the code cannot be redistributed here:

- 0xbasedev/ss-dcme: VB6 with MDIForm and user controls; Randy Birch 1996 and KPD-Team headers; no licence
- Touched/EliteMap and Touched/Sappy: ROM tools with vbAccelerator 1998 and 1999 classes; no licence
- VBGAMER45/Semi-VB-Decompiler: contains Brad Martinez 1997-1999 and Karl Peterson 1994-2000 modules; no licence
- badcodes/vb6: large personal archive, Trigeminal 1999 and Steve McMahon code; no licence
- codearchitects/vbmigration-code-samples: Francesco Balena 1998 book samples; no licence
- sourcecode-museum/VB6.Activex: KPD-Team 1998 modules; no licence
- rietta/personal_directory_manager: forms say "Copyright 1996-1999 Rietta", Desaware 1992-1996 module; no licence
- manojdjoshi/ACTIVELOCK: Nelson Ferraz 1998-2002 headers; no top-level licence
- javiercrowsoft/cairo-vb6: very large ERP with 15 MDIForms; no licence
- clayreimann/CodeHelp, froque/Make-My-Manifest, icez/revemu-mc, lee-soft/ViGlance, peterson1/vb6-toolbox, syntax53/MMUD-Explorer, visual2000/DadaCards, zha0/pdfstreamdumper, darkain/alpha, contensive/aoPrimitives, contensive/aoFilemanager, kernja/vb6-treasure-quest-v1, kernja/vb6-treasure-quest-v2, kernja/vb6-a3-launcher: VB6 present; no licence
- Planet-Source-Code/asgeir-bjarni-ingvarsson-encryption-library__1-7966: PSC id below 8000 (1999 era), MD5.bas "Copyright 1998, Ian Lynagh"; no licence
- Planet-Source-Code/mark-einhorn-mdichildmaker-use-activex-forms-as-mdi-child-forms__1-4409: PSC id 4409 (1999 era), MDIForm; no licence
- Planet-Source-Code/c-dutoit-gmindmap__1-10480: KPD-Team 1998 module; no licence
- Planet-Source-Code/brian-lockwood-floating-calendar-control__1-10177, dave-katrowski-knob-ocx__1-11670, gregg-housh-mx-lookup-control-usercontrol__1-11306, bob-stout-republished-under-open-content-license__3-564, salvo-cortesiano-italy-radio-streaming-recorder__1-73924: no licence file covering the VB code (salvo-cortesiano ships only the dsnative library COPYING)

Licence present but not an open licence, or the grant does not clearly cover the VB code:

- arundaleais/decodersource: custom licence reserving the right to charge royalties
- syntax53/Nightmare-Redux: custom EULA in license.rtf, not an open licence
- Matthew-Lancaster/Matthew-Lancaster: Unlicense applied to a personal archive of third-party code (Ray Mercer 1997-1998 and others); the uploader cannot grant it
- umby24/Netbattle: MIT on a repository that preserves the original Pokemon NetBattle 9.6 sources; original authorship of that code is not documented in the repo
- Planet-Source-Code/daniel-green-a-gui-for-the-nullsoft-install-system-nsis__1-26151: the only licence file is the Nullsoft NSIS zlib licence (Copyright 1999-2001 Nullsoft); it does not name the GUI author, although modFunctions.bas carries "Version 1.2 (Sept. 1996 - Dec 1999)"

Licensed but no VB6 source files:

- Doom-Utils/iwad-patches (WTFPL): the .frm files are id Software order forms, plain text
- aa24615/wework-msgaudit (MIT): the .frm files are MySQL table definitions
- demasylabs/Point-Of-Sale (Apache-2.0): the .ctl files are Oracle SQL*Loader control files
- loopy750/SRT-Stats-Monitor (GPL-3.0): QB64 InForm .frm files, not VB6
- ruddj/SportsAdmin (MIT): Microsoft Access form exports saved as .bas
- tminard/old-liberty-basic (no licence): Liberty BASIC .bas files
- KubaO/GdiPlus (MIT), Theadd/ArrayList (Unlicense), fafalone/WinDevLib (CC0-1.0), fafalone/MemListMgr, fafalone/ZoneStripper, fafalone/DeviceExplorer, fafalone/ExplorerHost, fafalone/RegShellWindow, fafalone/ucSimplePlayer, fafalone/UIRibbonDemos (MIT): twinBASIC only: .twinproj present, no .vbp, or every source uses LongPtr
- Neo-Desktop/planetflux (licence nested in src/): .bas files are decompiler output with no VB_Name header

Copyleft projects that are valid VB6 but were not needed to reach the bar and carry no pre-2000 evidence, so they were left out to keep the corpus mostly permissive:

- dragokas/hijackthis (GPL-2.0), yereverluvinunclebert/SteamyDock (GPL-2.0), lvcabral/w.bloggar (GPL-2.0), hlizard/VBScroll (GPL-2.0), OlimilO1402/Win_Dialogs, OlimilO1402/KORG_Read_pcg, OlimilO1402/Ctrl_TabControl, OlimilO1402/Ctrl_Splitter (GPL-3.0), OverQuantum/mp_extsimp, heinsega/OX163, w2sft/Ty2yAntiVirus, jafeucht/VB6-ArrowControl, jafeucht/VB6-ShapeScreenSaver, jwillians/opendialup, mikechambers84/BasicBox, leonunezcl/jsplus, JoseMLiza/ucJLAnchor, lee-soft/ViOrb (GPL-3.0), lee-soft/ViStart, ao-libre/ao-cliente, ao-org/argentum-online-client (AGPL-3.0), MPSystemsServices/CodeBase-for-DBF, cambusa/rymedio (LGPL-3.0), Philippe734/VPN-Lifeguard (GPL-3.0, has a 1999 KPD-Team module), Planet-Source-Code GPL-2.0 re-uploads benjamin-marty-scrolling-game-development-kit__1-22201, roger-light-dynmenu__1-38703, brian-clark-devcon-ftp-3-0-3__1-39307, shawn-j-cox-devcon-ftp-3-0-4__1-57336, been-lucky-wompus-board-game__1-54202, nathiel-thomas-tinsley-actor__1-42189, bagus-judistirah-simple-machine-protect-v1-x__1-70409

Left out only by the six-projects-per-account cap: EduardoVB/ShapeEx, Gagniuc/PI-laboratory-in-VB6, Gagniuc/Diabetes-prediction-1.0 (all MIT or MIT-0, valid VB6).
