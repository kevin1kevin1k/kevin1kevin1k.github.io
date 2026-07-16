% !TEX TS-program = xelatex
% !TEX encoding = UTF-8 Unicode
% -*- coding: UTF-8; -*-
% vim: set fenc=utf-8

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% SIMPLE-RESUME-CV
%% <https://github.com/zachscrivena/simple-resume-cv>
%% This is free and unencumbered software released into the
%% public domain; see <http://unlicense.org> for details.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{simpleresumecv}[2016/12/20 Simple Resume CV https://github.com/zachscrivena/simple-resume-cv]

\DeclareOption{a4paper}{\PassOptionsToClass{\CurrentOption}{article}}
\DeclareOption{letterpaper}{\PassOptionsToClass{\CurrentOption}{article}}

% Run in non-stop mode.
\DeclareOption{nonstopmode}{\nonstopmode}

% Draft mode.
\newcommand{\TypesetInDraftMode}{0}
\DeclareOption{draftmode}{\renewcommand{\TypesetInDraftMode}{1}}

% Datestamp format (default): {yyyy}{MM}{dd} ---> MMM yyyy (e.g., Jan 2008).
\newcommand{\DatestampYMD}[3]{\mbox{\ShortMonth{#2} #1}}
\newcommand{\DatestampYM}[2]{\mbox{\ShortMonth{#2} #1}}
\newcommand{\DatestampY}[1]{#1}
\DeclareOption{MMMyyyy}{} % default

% Datestamp format: {yyyy}{MM}{dd} ---> dd MMM yyyy (e.g., 15 Jan 2008).
\DeclareOption{ddMMMyyyy}{%
\renewcommand{\DatestampYMD}[3]{\mbox{#3 \ShortMonth{#2} #1}}
\renewcommand{\DatestampYM}[2]{\mbox{\ShortMonth{#2} #1}}
\renewcommand{\DatestampY}[1]{#1}}

% Datestamp format: {yyyy}{MM}{dd} ---> MMMM yyyy (e.g., January 2008).
\DeclareOption{MMMMyyyy}{%
\renewcommand{\DatestampYMD}[3]{\mbox{\LongMonth{#2} #1}}
\renewcommand{\DatestampYM}[2]{\mbox{\LongMonth{#2} #1}}
\renewcommand{\DatestampY}[1]{#1}}

% Datestamp format: {yyyy}{MM}{dd} ---> dd MMMM yyyy (e.g., 15 January 2008).
\DeclareOption{ddMMMMyyyy}{%
\renewcommand{\DatestampYMD}[3]{\mbox{#3 \LongMonth{#2} #1}}
\renewcommand{\DatestampYM}[2]{\mbox{\LongMonth{#2} #1}}
\renewcommand{\DatestampY}[1]{#1}}

% Datestamp format: {yyyy}{MM}{dd} ---> yyyy-MM-dd (e.g., 2008-01-15).
\DeclareOption{yyyyMMdd}{%
\renewcommand{\DatestampYMD}[3]{\mbox{#1-#2-#3}}
\renewcommand{\DatestampYM}[2]{\mbox{#1-#2}}
\renewcommand{\DatestampY}[1]{#1}}

% Datestamp format: {yyyy}{MM}{dd} ---> yyyy-MM (e.g., 2008-01).
\DeclareOption{yyyyMM}{%
\renewcommand{\DatestampYMD}[3]{\mbox{#1-#2}}
\renewcommand{\DatestampYM}[2]{\mbox{#1-#2}}
\renewcommand{\DatestampY}[1]{#1}}

% Datestamp format: {yyyy}{MM}{dd} ---> yyyy (e.g., 2008).
\DeclareOption{yyyy}{%
\renewcommand{\DatestampYMD}[3]{#1}
\renewcommand{\DatestampYM}[2]{#1}
\renewcommand{\DatestampY}[1]{#1}}

\ProcessOptions\relax

% Use article class as the base class.
\LoadClass[10pt,oneside]{article}

% Geometry package for page margins.
\RequirePackage[
left=0.70in,
right=0.70in,
top=0.60in,
bottom=0.25in,
nohead,
includefoot]{geometry}

% PDF settings and properties.
\RequirePackage{hyperref}

% Hyphenation: Disabled.
\RequirePackage[none]{hyphenat}

% Colors.
\RequirePackage[usenames]{color}
% \definecolor{MyDarkBlue}{RGB}{0,90,160}
% {\color{MyDarkBlue}This text is dark blue}

% Current date and time.
\RequirePackage{datetime2}

% Timestamp.
\newcommand{\Timestamp}{{\DTMnow}}

% Abbreviations for months.
\newcommand{\LongMonth}[1]{%
\ifcase#1\relax
\or January%
\or February%
\or March%
\or April%
\or May%
\or June%
\or July%
\or August%
\or September%
\or October%
\or November%
\or December%
\fi}
\newcommand{\ShortMonth}[1]{%
\ifcase#1\relax
\or Jan%
\or Feb%
\or Mar%
\or Apr%
\or May%
\or Jun%
\or Jul%
\or Aug%
\or Sep%
\or Oct%
\or Nov%
\or Dec%
\fi}

% XeLaTeX packages.
\RequirePackage{fontspec}
\defaultfontfeatures{Ligatures=TeX}
\RequirePackage{xunicode}
\RequirePackage{xltxtra}

% Font: Use "Tinos" as the main typeface (\textnormal{}, \normalfont).
% The "Tinos" fonts are released under the Apache License Version 2.0,
% and can be downloaded for free at <http://www.fontsquirrel.com/fonts/tinos>.
% Symbol table: <http://www.fileformat.info/info/unicode/font/tinos/grid.htm>
\setmainfont
[Path=./Fonts/Tinos/,
ItalicFont=Tinos-Italic,
BoldFont=Tinos-Bold,
BoldItalicFont=Tinos-BoldItalic]
{Tinos-Regular.ttf}

% Secondary font: "GNU FreeFont".
% The "GNU FreeFont" fonts are released under the
% GNU General Public License Version 3, and can be downloaded
% for free at <https://savannah.gnu.org/projects/freefont/>.
\newcommand{\UseSecondaryFont}{\fontspec
[Path=./Fonts/GNUFreeFont/,
ItalicFont=FreeSerifItalic,
BoldFont=FreeSerifBold,
BoldItalicFont=FreeSerifBoldItalic]
{FreeSerif.otf}}

% Sans-serif font: Changed to "Tinos".
\renewcommand{\sffamily}{\rmfamily}

% Typewriter (monospace) font: Changed to "Tinos".
\renewcommand{\ttfamily}{\rmfamily}

% Small caps font: Changed to "Tinos".
\renewcommand{\scshape}{\rmfamily}
%\renewcommand{\textsc}[1]{\textbf{\MakeUppercase{#1}}}

% Font styles.
\newcommand{\UseHeadingFont}{\normalfont}
\newcommand{\UseHeaderFooterFont}{\UseHeadingFont\fontsize{8.2pt}{9.5pt}\selectfont}
\newcommand{\UseNoteFont}{\UseHeadingFont\fontsize{8pt}{9.6pt}\selectfont}
\newcommand{\UseTitleFont}{\UseHeadingFont\fontsize{28pt}{33.6pt}\selectfont\bfseries}
\newcommand{\UseSubTitleFont}{\normalfont\fontsize{8.6pt}{10.3pt}\selectfont}
\newcommand{\UseSectionFont}{\UseHeadingFont\fontsize{9pt}{11pt}\selectfont\bfseries}
\newcommand{\UseSubSectionFont}{\UseHeadingFont\fontsize{8.6pt}{10.3pt}\selectfont\bfseries}
\newcommand{\UseDetailFont}{\normalfont\fontsize{8.6pt}{10.3pt}\selectfont}

% Symbols (unicode).
\newcommand{\BulletSymbol}{{\normalfont\fontsize{6.5}{7.8}\selectfont\raisebox{0.17em}{\char"25A0}}}
\newcommand{\SubBulletSymbol}{{\normalfont\fontsize{6}{7.2}\selectfont\raisebox{0.17em}{\char"25CF}}}
\newcommand{\TildeSymbol}{{\normalfont\char"007E}}

% Headers and footers: Blank header, page number in footer.
\AtEndDocument{\null\label{LastPage}}
\newcommand{\PageKOfN}{{\UseHeaderFooterFont{Page}~\thepage~of~\pageref{LastPage}}}
\newcommand{\DraftStamp}{{\UseHeaderFooterFont\color{red}DRAFT~\Timestamp}}

\ifnum\TypesetInDraftMode=0
\newcommand{\HeaderText}{}
\newcommand{\FooterText}{\hfill\PageKOfN\hfill}
\else
\newcommand{\HeaderText}{}
\newcommand{\FooterText}{\null\hphantom{\DraftStamp}\hfill%
\PageKOfN\hfill%
\DraftStamp\null}
\fi

\def\ps@plain{%
\def\@oddhead{\HeaderText}%
\def\@evenhead{\HeaderText}%
\def\@oddfoot{\FooterText}%
\def\@evenfoot{\FooterText}}

% \pagestyle{plain}

% Paragraph style.
\setlength{\parindent}{0in} % No indentation at the beginning of each paragraph.
\setlength{\parskip}{0in} % No vertical space between paragraphs.

% Avoid bad page breaks within paragraphs.
\widowpenalties 1 10000
\clubpenalties 1 10000
\raggedbottom

% Avoid overfull lines.
\sloppy

% Footnotes: Use symbols instead of numbers for labels.
\renewcommand{\thefootnote}{\fnsymbol{footnote}}

% Macro: Title (name).
\newcommand{\Title}[1]{%
\par\pdfbookmark[1]{#1}{#1}%
\begingroup\centering%
\UseTitleFont{#1}%
\par\endgroup\par}

% Macro: SubTitle (personal information below name).
\newenvironment{SubTitle}
{\par\vspace{0.25\baselineskip}%
\begingroup\centering%
\UseSubTitleFont}
{\par\endgroup\par}

% Macro: Body (rest of the document).
\newenvironment{Body}
{%
\par\vspace{1.5\baselineskip}%
\begin{list}
{}
{\setlength\leftmargin{1.2in}%
\setlength\rightmargin{0in}%
\setlength\labelwidth{1.2in}%
\setlength\labelsep{0in}%
\setlength\listparindent{0in}%
\setlength\itemindent{0in}%
\setlength\parskip{0in}%
\setlength\topsep{0in}%
\setlength\parsep{0in}%
\setlength\itemsep{0.85\baselineskip}%
\setlength\partopsep{0in}%
%\raggedright%
}%
}
{%
\end{list}%
\par%
}

% Macro: Gap (vertical gap between items in the same section).
\newcommand{\Gap}{\par\vspace{0.25\baselineskip}\par}

% Macro: BigGap (big vertical gap between items in the same section).
\newcommand{\BigGap}{\par\vspace{0.50\baselineskip}\par}

% Macro: Section (new section for Education, Research Experience, etc.).
\newcommand{\Section}[3]
{\par\pdfbookmark[2]{#2}{#3}%
\item[\smash{\parbox[t]{1.2in}{\UseSectionFont\raggedright\MakeUppercase{#1}}}]%
\par}

% Macro: SubSection.
\newcommand{\SubSection}[3]
{\par\pdfbookmark[3]{#2}{#3}%
{\UseSubSectionFont\raggedright\MakeUppercase{#1}}%
\par}

% Macro: Detail (text in smaller font under an item).
\newenvironment{Detail}
{\par\begingroup\UseDetailFont}
{\par\endgroup\par}

% Macro: BulletItem.
\newsavebox{\BulletItemIndentBox}
\newlength{\BulletItemIndentWidth}
%
\newcommand{\BulletItem}
{\par\vspace{0\baselineskip}%
\savebox{\BulletItemIndentBox}{\hspace{1.5mm}\BulletSymbol\hspace{1.5mm}}%
\settowidth{\BulletItemIndentWidth}{\usebox{\BulletItemIndentBox}}%
\parshape 2%
\labelwidth \linewidth%
\dimexpr\labelwidth+\BulletItemIndentWidth\relax \dimexpr\linewidth-\BulletItemIndentWidth\relax%
\usebox{\BulletItemIndentBox}%
\ignorespaces%
}

% Macro: SubBulletItem.
\newsavebox{\SubBulletItemIndentBox}
\newlength{\SubBulletItemIndentWidth}
%
\newcommand{\SubBulletItem}
{\par\vspace{0\baselineskip}%
\savebox{\SubBulletItemIndentBox}{\hspace{5.6mm}\SubBulletSymbol\hspace{1.5mm}}%
\settowidth{\SubBulletItemIndentWidth}{\usebox{\SubBulletItemIndentBox}}%
\parshape 2%
\labelwidth \linewidth%
\dimexpr\labelwidth+\SubBulletItemIndentWidth\relax \dimexpr\linewidth-\SubBulletItemIndentWidth\relax%
\usebox{\SubBulletItemIndentBox}%
\ignorespaces%
}

% Macro: Entry.
\newcommand{\Entry}
{\par\vspace{0\baselineskip}%
\parshape 1%
\labelwidth \linewidth%
\ignorespaces%
}

% Macro: Item (aligns horizontally with BulletItem).
\newcommand{\Item}
{\par\vspace{0\baselineskip}%
\savebox{\BulletItemIndentBox}{\hphantom{\hspace{1.5mm}\BulletSymbol\hspace{1.5mm}}}%
\settowidth{\BulletItemIndentWidth}{\usebox{\BulletItemIndentBox}}%
\parshape 2%
\labelwidth \linewidth%
\dimexpr\labelwidth+\BulletItemIndentWidth\relax \dimexpr\linewidth-\BulletItemIndentWidth\relax%
\usebox{\BulletItemIndentBox}%
\ignorespaces%
}

% Macro: SubItem (aligns horizontally with SubBulletItem).
\newcommand{\SubItem}
{\par\vspace{0\baselineskip}%
\savebox{\SubBulletItemIndentBox}{\hphantom{\hspace{5.6mm}\SubBulletSymbol\hspace{1.5mm}}}%
\settowidth{\SubBulletItemIndentWidth}{\usebox{\SubBulletItemIndentBox}}%
\parshape 2%
\labelwidth \linewidth%
\dimexpr\labelwidth+\SubBulletItemIndentWidth\relax \dimexpr\linewidth-\SubBulletItemIndentWidth\relax%
\usebox{\SubBulletItemIndentBox}%
\ignorespaces%
}

% Macro: NumberedItem.
\newcommand{\MaxNumberedItem}{[88]}
%
\newsavebox{\MaxNumberedItemIndentBox}
\newlength{\MaxNumberedItemIndentWidth}
\newsavebox{\NumberedItemIndentBox}
\newlength{\NumberedItemIndentWidth}
%
\newcommand{\NumberedItem}[1]
{\par\vspace{0\baselineskip}%
\savebox{\MaxNumberedItemIndentBox}{\hspace{1.5mm}{\MaxNumberedItem}\hspace{2.5mm}}%
\settowidth{\MaxNumberedItemIndentWidth}{\usebox{\MaxNumberedItemIndentBox}}%
\savebox{\NumberedItemIndentBox}{\hspace{1.5mm}{#1}\hspace{2.5mm}}%
\settowidth{\NumberedItemIndentWidth}{\usebox{\NumberedItemIndentBox}}%
\parshape 2%
\labelwidth \linewidth%
\dimexpr\labelwidth+\MaxNumberedItemIndentWidth\relax \dimexpr\linewidth-\MaxNumberedItemIndentWidth\relax%
\hspace{\dimexpr\MaxNumberedItemIndentWidth-\NumberedItemIndentWidth\relax}%
\usebox{\NumberedItemIndentBox}%
\ignorespaces%
}

% Macro: Hide.
\newcommand{\Hide}[1]{}

% End of class file.
\endinput








%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% THIS IS A SECTION WITH USAGE NOTES %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% % Declare a new group to limit the scope of \color to this section.
% \begingroup
% \color{red}

% \Section
% {This is a\newline
% Section\newline
% With\newline
% Usage Notes}
% {This is a Section With Usage Notes (For PDF Bookmark)}
% {PDF:ThisIsASectionWithUsageNotes:ForPDFLink}

% \SubSection
% {This is a SubSection}
% {This is a SubSection (For PDF Bookmark)}
% {PDF:ThisIsASubSection:ForPDFLink}

% \Gap
% \BulletItem
% Use \CodeCommand{Section\{a\}\{b\}\{c\}} and
% \CodeCommand{SubSection\{a\}\{b\}\{c\}}
% to create sections and subsections, where
% \Code{a} is the heading displayed on the page,
% \Code{b} is the PDF bookmark heading, and
% \Code{c} is the internal PDF link (must be unique).
% Sections and subsections will appear in the PDF bookmarks.
% Note the CamelCase command names.

% \Gap
% \BulletItem
% Use
% \CodeCommand{Entry},
% \CodeCommand{BulletItem},
% \CodeCommand{SubBulletItem},
% \CodeCommand{Item},
% \CodeCommand{SubItem},
% \CodeCommand{NumberedItem},
% etc.,
% to create entries in the main body of the CV.

% \Gap
% \BulletItem
% Enclose entry details between
% \CodeCommand{begin\{Detail\}} and
% \CodeCommand{end\{Detail\}}
% so that they are typeset in a smaller font.
% \begin{Detail}
% \Item
% This is an example of entry detail text enclosed in a \Code{Detail} environment.
% \end{Detail}

% \Gap
% \BulletItem
% Use \CodeCommand{Gap} and \CodeCommand{BigGap} to insert vertical spaces between entries to improve layout.

% \BigGap
% \SubSection
% {This is Another SubSection}
% {This is Another Subsection (For PDF Bookmark)}
% {PDF:ThisIsAnotherSubSection:ForPDFLink}

% \Gap
% \Entry
% This is a plain \CodeCommand{Entry},
% followed by an \CodeCommand{hfill} and a date range
% \hfill
% \DatestampYM{2015}{10} --
% \DatestampYM{2015}{12}

% \Gap
% \BulletItem
% This is a \CodeCommand{BulletItem}.
% \Item
% This is an \CodeCommand{Item}, which has no bullet.
% Note the alignment with the \CodeCommand{BulletItem} above.

% \Gap
% \SubBulletItem
% This is a \CodeCommand{SubBulletItem}.
% \SubItem
% This is a \CodeCommand{SubItem}, which has no bullet.
% Note the alignment with the \CodeCommand{SubBulletItem} above.

% \Gap
% \NumberedItem{[42]}
% This is a \CodeCommand{NumberedItem}.
% Change the value of the macro \CodeCommand{MaxNumberedItem} to adjust the indentation width.

% \BigGap
% \SubSection
% {Line, Paragraph, and Page Breaks}
% {Line, Paragraph, and Page Breaks (For PDF Bookmark)}
% {PDF:LineParagraphAndPageBreaks:ForPDFLink}

% \Gap
% \BulletItem
% To create a new line within the same paragraph (i.e., preserving the same paragraph indentation), use \CodeCommand{newline} instead of \CodeCommand{\textbackslash};
% the latter will reset the paragraph indentation.

% \Gap
% \BulletItem
% To create a new paragraph, use \CodeCommand{par} or simply leave an empty line.
% Paragraph indentations (from
% \CodeCommand{Entry},
% \CodeCommand{BulletItem},
% \CodeCommand{SubBulletItem},
% \CodeCommand{Item},
% \CodeCommand{SubItem},
% \CodeCommand{NumberedItem},
% etc.) do not carry across different paragraphs.

% \Gap
% \BulletItem
% To create a new page, use \CodeCommand{newpage}.

% \BigGap
% \SubSection
% {Dates}
% {Dates (For PDF Bookmark)}
% {PDF:Dates:ForPDFLink}

% \Gap
% \BulletItem
% Use the following macros to specify and display dates consistently:
% \SubBulletItem
% \CodeCommand{DatestampYMD\{yyyy\}\{MM\}\{dd\}}
% (e.g., \CodeCommand{DatestampYMD\{2008\}\{01\}\{15\}})
% \SubBulletItem
% \CodeCommand{DatestampYM\{yyyy\}\{MM\}}
% (e.g., \CodeCommand{DatestampYM\{2008\}\{01\}})
% \SubBulletItem
% \CodeCommand{DatestampY\{yyyy\}}
% (e.g., \CodeCommand{DatestampY\{2008\}})

% \Gap
% \BulletItem
% Change the date format option passed to the document class to adjust how dates are displayed throughout the document:
% \SubBulletItem
% \Code{MMMyyyy} (``Jan~2008'')
% \SubBulletItem
% \Code{ddMMMyyyy} (``15~Jan~2008'')
% \SubBulletItem
% \Code{MMMMyyyy} (``January~2008'')
% \SubBulletItem
% \Code{ddMMMMyyyy} (``15~January~2008'')
% \SubBulletItem
% \Code{yyyyMMdd} (``2008-01-15'')
% \SubBulletItem
% \Code{yyyyMM} (``2008-01'')
% \SubBulletItem
% \Code{yyyy} (``2008'')

% \endgroup
