import { SearchBox } from "@/components/search/SearchBox";
export const metadata={title:"Buscar"};
export default function SearchPage(){return <div className="page"><div className="page-title"><span className="eyebrow">GLOBAL SEARCH</span><h1>BUSCAR</h1><p>Busca peleadores por nombre o nickname y próximos eventos.</p></div><div className="search-page-box"><SearchBox autoFocus/></div></div>}
