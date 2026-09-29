import errata_data as d, csv
def q(v):
    if v is None: return 'NULL'
    if isinstance(v,int): return str(v)
    return "'"+str(v).replace('\\','\\\\').replace("'","''")+"'"
out=[]
W=out.append
W("""-- Redemption errata: structured data for MySQL 8
-- Generated 2026-09-27 from `Redemption Errata.txt` (project doc). Keep the two in sync:
-- the text file is the human-readable version; this script is the loadable version.
--
-- Tables
--   errata         One row per errata entry (one line of the text file).
--     ErrataID       Position in book order. Renumbered when entries are added, so always
--                    reload the whole script; don't reference these IDs from other tables.
--     Section        Combat | Item Creation | Gear | Psionics
--     PageStart      Book page (PageEnd is set only for ranges, e.g. 226-271).
--     Subject        Rule or item the entry is about (human label).
--     ErrataType     rule | stat | clarification | replacement | typo
--                    (replacement = the whole stat block is replaced; see ErrataText)
--     ErrataText     The full errata wording, as published.
--     AddedOn        NULL for the original errata; the date for entries added since.
--   errata_change  Zero or more machine-readable changes per entry.
--     ItemName       Exact item name in docs/equipment_catalog.md, or NULL for rule changes.
--     FieldName, OldValue, NewValue   What changed. Values are display text, not numbers.
--
-- Reloadable: drops and recreates both tables. Table names are lowercase (MySQL on Linux
-- is case-sensitive), matching the rest of the schema.

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `errata_change`;
DROP TABLE IF EXISTS `errata`;

CREATE TABLE `errata` (
  `ErrataID`   INT          NOT NULL,
  `Section`    VARCHAR(32)  NOT NULL,
  `PageStart`  SMALLINT     NOT NULL,
  `PageEnd`    SMALLINT     NULL,
  `Subject`    VARCHAR(128) NOT NULL,
  `ErrataType` VARCHAR(16)  NOT NULL,
  `ErrataText` TEXT         NOT NULL,
  `AddedOn`    DATE         NULL,
  PRIMARY KEY (`ErrataID`),
  KEY `ix_errata_page` (`PageStart`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `errata_change` (
  `ErrataChangeID` INT          NOT NULL,
  `ErrataID`       INT          NOT NULL,
  `ItemName`       VARCHAR(128) NULL,
  `FieldName`      VARCHAR(96)  NOT NULL,
  `OldValue`       VARCHAR(255) NULL,
  `NewValue`       VARCHAR(255) NOT NULL,
  PRIMARY KEY (`ErrataChangeID`),
  KEY `ix_errata_change_item` (`ItemName`),
  CONSTRAINT `fk_errata_change_errata` FOREIGN KEY (`ErrataID`) REFERENCES `errata` (`ErrataID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
""")
W("INSERT INTO `errata` (`ErrataID`, `Section`, `PageStart`, `PageEnd`, `Subject`, `ErrataType`, `ErrataText`, `AddedOn`) VALUES")
rows=[f"({i}, {q(x['section'])}, {x['p1']}, {q(x['p2'])}, {q(x['subject'])}, {q(x['kind'])}, {q(x['text'])}, {q(x['added'])})" for i,x in enumerate(d.E,1)]
W(",\n".join(rows)+";\n")
W("INSERT INTO `errata_change` (`ErrataChangeID`, `ErrataID`, `ItemName`, `FieldName`, `OldValue`, `NewValue`) VALUES")
cr=[];n=0;flat=[]
for i,x in enumerate(d.E,1):
    if not x['changes']:
        flat.append([i,x['section'],x['p1'],x['p2'] or '',x['subject'],x['kind'],x['added'] or '','','','','',x['text']])
    for item,f,o,nv in x['changes']:
        n+=1; cr.append(f"({n}, {i}, {q(item)}, {q(f)}, {q(o if o!='' else None)}, {q(nv)})")
        flat.append([i,x['section'],x['p1'],x['p2'] or '',x['subject'],x['kind'],x['added'] or '',item or '',f,o,nv,x['text']])
W(",\n".join(cr)+";\n")
open('/mnt/user-data/outputs/errata.sql','w',encoding='utf-8').write("\n".join(out))
with open('/mnt/user-data/outputs/errata.csv','w',encoding='utf-8-sig',newline='') as fh:
    w=csv.writer(fh); w.writerow(['ErrataID','Section','PageStart','PageEnd','Subject','ErrataType','AddedOn','ItemName','FieldName','OldValue','NewValue','ErrataText']); w.writerows(flat)
print(len(d.E),n,len(flat))
