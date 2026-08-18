
import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
  LayoutDashboard, ClipboardList, CreditCard, CalendarDays, Tags, Users,
  Menu, X, Search, Plus, Eye, Pencil, Trash2, Download, Check, LogOut,
  UserCircle, KeyRound, ChevronDown, MoreHorizontal
} from 'lucide-react';
import './styles.css';

const KEY='pitchxpo_react_exact_v1';
const seed={
 applications:[
  {id:'PX-10248',applicant:'ABC Technologies',email:'hello@abctech.com',phone:'+91 98765 12001',type:'Raise Funds',event:'PitchXPO Conclave',amount:99,payment:'Paid',status:'New',date:'2026-08-18',note:'',documents:['Pitch Deck.pdf','Company Profile.pdf']},
  {id:'PX-10247',applicant:'Nova Properties',email:'contact@novaproperties.com',phone:'+91 98765 12002',type:'Showcase',event:'PitchXPO Conclave',amount:99,payment:'Paid',status:'Reviewing',date:'2026-08-17',note:'Financial documents need review.',documents:['Company Profile.pdf']},
  {id:'PX-10246',applicant:'Northstar Capital',email:'team@northstar.com',phone:'+91 98765 12003',type:'Investor Success Story',event:'PitchXPO Conclave',amount:299,payment:'Paid',status:'Approved',date:'2026-08-16',note:'Approved by admin.',documents:['Success Story.pdf','Logo.png']},
  {id:'PX-10245',applicant:'Vertex Labs',email:'founders@vertexlabs.com',phone:'+91 98765 12004',type:'Raise Funds',event:'PitchXPO Conclave',amount:99,payment:'Unpaid',status:'New',date:'2026-08-15',note:'',documents:['Pitch Deck.pdf']},
  {id:'PX-10244',applicant:'GreenGrid Energy',email:'admin@greengrid.com',phone:'+91 98765 12005',type:'Showcase',event:'Innovation Summit',amount:149,payment:'Paid',status:'Approved',date:'2026-08-14',note:'',documents:['Deck.pdf','Certificate.pdf']},
  {id:'PX-10243',applicant:'BlueOrbit AI',email:'team@blueorbit.ai',phone:'+91 98765 12006',type:'Raise Funds',event:'Innovation Summit',amount:99,payment:'Paid',status:'Rejected',date:'2026-08-13',note:'Category does not match current criteria.',documents:['Pitch Deck.pdf']}
 ],
 payments:[
  {id:'PAY-9001',application:'PX-10248',applicant:'ABC Technologies',type:'Raise Funds',amount:99,status:'Paid',reference:'pi_8KAB1201',date:'2026-08-18'},
  {id:'PAY-9002',application:'PX-10247',applicant:'Nova Properties',type:'Showcase',amount:99,status:'Paid',reference:'pi_8KAB1202',date:'2026-08-17'},
  {id:'PAY-9003',application:'PX-10246',applicant:'Northstar Capital',type:'Investor Success Story',amount:299,status:'Paid',reference:'pi_8KAB1203',date:'2026-08-16'},
  {id:'PAY-9004',application:'PX-10245',applicant:'Vertex Labs',type:'Raise Funds',amount:99,status:'Unpaid',reference:'—',date:'2026-08-15'},
  {id:'PAY-9005',application:'PX-10244',applicant:'GreenGrid Energy',type:'Showcase',amount:149,status:'Paid',reference:'pi_8KAB1205',date:'2026-08-14'}
 ],
 events:[
  {id:'EV-001',name:'PitchXPO Conclave',fromDate:'2026-09-18',toDate:'2026-09-20',venue:'Expo City',status:'Open',applications:132},
  {id:'EV-002',name:'Innovation Summit',fromDate:'2026-10-09',toDate:'2026-10-11',venue:'Dubai World Trade Centre',status:'Open',applications:74},
  {id:'EV-003',name:'Investor Forum',fromDate:'2026-11-21',toDate:'2026-11-22',venue:'Abu Dhabi',status:'Closed',applications:42}
 ],
 types:[
  {id:'TP-001',name:'Raise Funds',description:'For ventures seeking capital and investor access.',price:99,active:true},
  {id:'TP-002',name:'Showcase',description:'For founders showcasing products and innovations.',price:149,active:true},
  {id:'TP-003',name:'Investor Success Story',description:'Featured success stories and investor outcomes.',price:299,active:true}
 ],
 users:[
  {id:'USR-001',name:'Admin User',email:'admin@pitchxpo.com',role:'Administrator',status:'Active',lastLogin:'Today, 10:32 AM'},
  {id:'USR-002',name:'Sarah Khan',email:'sarah@pitchxpo.com',role:'Reviewer',status:'Active',lastLogin:'Today, 09:18 AM'},
  {id:'USR-003',name:'David Mathew',email:'david@pitchxpo.com',role:'Finance',status:'Active',lastLogin:'Yesterday, 05:42 PM'}
 ],
 account:{name:'Admin User',email:'admin@pitchxpo.com',phone:'+971 50 123 4567',role:'Administrator'}
};

const money=v=>'$'+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const initials=n=>String(n||'A').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
function loadDB(){try{const x=localStorage.getItem(KEY);if(x)return JSON.parse(x)}catch{} localStorage.setItem(KEY,JSON.stringify(seed));return structuredClone(seed)}
function Badge({children}){const map={Paid:'paid',Unpaid:'pending',Approved:'approved',Reviewing:'review',New:'new',Rejected:'rejected',Active:'active',Inactive:'inactive',Open:'open',Closed:'closed'};return <span className={`badge ${map[children]||'new'}`}>{children}</span>}
const navItems=[
 ['dashboard','Dashboard',LayoutDashboard],['applications','Applications',ClipboardList],['payments','Payments',CreditCard],
 ['events','Events',CalendarDays],['types','Types & Pricing',Tags],['users','Admin Users',Users]
];

function Login({onLogin}) {
 const [email,setEmail]=useState(''),[pass,setPass]=useState(''),[show,setShow]=useState(false),[err,setErr]=useState(false);
 return <div className="login-page"><div className="login-shell">
  <section className="login-brand-side"><img src="/src/assets/pitch-logo.png" alt="Pitch"/><h2>PitchXPO Admin Portal</h2><p>Manage applications, events, payments and administration from one simple workspace.</p>
   <div className="login-points"><div className="login-point"><span>✓</span>Application review &amp; approval</div><div className="login-point"><span>✓</span>Events, dates &amp; pricing</div><div className="login-point"><span>✓</span>Payments &amp; admin users</div></div>
  </section>
  <section className="login-form-side"><div className="eyebrow">Secure access</div><h1>Welcome back</h1><div className="login-sub">Sign in to continue to your PitchXPO Admin Panel.</div>
   <div className={`login-error ${err?'show':''}`}>Invalid email or password.</div>
   <form className="login-form" onSubmit={e=>{e.preventDefault();if(email.toLowerCase()==='admin@pitchxpo.com'&&pass==='Admin@1234')onLogin();else setErr(true)}}>
    <div className="field"><label>Email Address</label><input className="input" type="email" placeholder="Enter your email address" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
    <div className="field"><label>Password</label><div className="password-wrap"><input className="input" type={show?'text':'password'} placeholder="Enter your password" value={pass} onChange={e=>setPass(e.target.value)} required/><button className="show-pass" type="button" onClick={()=>setShow(!show)}>{show?'Hide':'Show'}</button></div></div>
    <div className="login-options"><label><input type="checkbox"/> Remember me</label><a href="#" onClick={e=>e.preventDefault()}>Forgot password?</a></div>
    <button className="primary login-submit">Login</button>
   </form>
   <div className="demo-login"><strong>Demo login</strong><br/>Email: admin@pitchxpo.com &nbsp; | &nbsp; Password: Admin@1234</div><div className="login-footer">PitchXPO Admin Panel · Secure administrator access</div>
  </section>
 </div></div>
}

function App(){
 const [db,setDb]=useState(loadDB),[logged,setLogged]=useState(sessionStorage.getItem('pitchxpo_session')==='1'),[page,setPage]=useState('dashboard'),[menu,setMenu]=useState(false),[modal,setModal]=useState(null);
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(db)),[db]);
 if(!logged)return <Login onLogin={()=>{sessionStorage.setItem('pitchxpo_session','1');setLogged(true)}}/>;
 const account=db.account;
 const go=p=>{setPage(p);setMenu(false);setModal(null)};
 const logout=()=>{sessionStorage.removeItem('pitchxpo_session');setLogged(false)};
 return <div className="shell">
  <aside className={`sidebar ${menu?'mobile-open':''}`}><div className="brand"><img src="/src/assets/pitch-logo.png" alt="Pitch"/></div>
   <nav className="menu">{navItems.map(([id,label,Icon])=><a key={id} className={page===id?'active':''} href="#" onClick={e=>{e.preventDefault();go(id)}}><span className="ico"><Icon size={17}/></span><span>{label}</span></a>)}</nav>
   <div className="sidebar-bottom"><strong>PitchXPO</strong>Admin Panel</div>
  </aside>
  {menu&&<div className="mobile-overlay" onClick={()=>setMenu(false)}/>}
  <main className="main">
   <header className="topbar"><button className="mobile-menu-btn" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button><div className="top-title">PitchXPO Admin</div>
    <div className="user-wrap"><div className="user" onClick={()=>setMenu(false)||setModal(modal==='profile'?null:'profile')}><div className="avatar">{initials(account.name)}</div><div className="u"><strong>{account.name}</strong><span>{account.role}</span></div><ChevronDown size={14}/></div>
      {modal==='profile'&&<div className="dropdown"><button onClick={()=>setPage('account')}>My Account</button><button onClick={()=>setPage('password')}>Change Password</button><button className="logout" onClick={logout}><LogOut size={14}/> Sign out</button></div>}
    </div>
   </header>
   {page==='dashboard'&&<Dashboard db={db} go={go}/>}
   {page==='applications'&&<Applications db={db} setDb={setDb} open={setModal}/>}
   {page==='payments'&&<Payments db={db}/>}
   {page==='events'&&<Events db={db} setDb={setDb}/>}
   {page==='types'&&<Types db={db} setDb={setDb}/>}
   {page==='users'&&<UsersPage db={db} setDb={setDb}/>}
   {page==='account'&&<Account db={db}/>}
   {page==='password'&&<Password/>}
  </main>
  {modal && modal!=='profile' && <Modal title={modal.title||'Application'} onClose={()=>setModal(null)}>{modal.content}</Modal>}
 </div>
}

function Page({eyebrow,title,sub,action,children}){return <div className="content"><div className="head-row"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{sub&&<div className="sub">{sub}</div>}</div>{action&&<div className="actions">{action}</div>}</div>{children}</div>}
function Dashboard({db,go}){const total=db.applications.length+242, pending=db.applications.filter(x=>x.status==='New'||x.status==='Reviewing').length, approved=db.applications.filter(x=>x.status==='Approved').length, collected=db.payments.filter(x=>x.status==='Paid').reduce((a,x)=>a+x.amount,0);return <Page title="Dashboard" sub="Application and payment overview" action={<button className="primary" onClick={()=>go('applications')}>View Applications</button>}><div className="cards">{[['Total Applications',total,'All application types'],['New / Pending',pending,'Needs review'],['Approved',approved,'Validated applications'],['Total Collected',money(collected+28100),'Successful payments']].map((x,i)=><div className="card" key={i}><div className="card-label">{x[0]}</div><div className={`metric ${i===1?'metric-accent':''}`}>{x[1]}</div><div className="metric-note">{x[2]}</div></div>)}</div><div className="grid2"><div className="panel"><div className="panel-pad"><div className="section-title"><h2>Applications by Type</h2><a href="#" onClick={e=>{e.preventDefault();go('applications')}}>View all</a></div>{['Raise Funds','Showcase','Investor Success Story'].map(t=>{let a=db.applications.filter(x=>x.type===t).length;return <div className="list-row" key={t}><strong>{t}</strong><span className="right muted">{a+30}</span><span className="right">{money((a+30)*99)}</span></div>})}</div></div><div className="panel"><div className="panel-pad"><div className="section-title"><h2>Quick Status</h2><a href="#" onClick={e=>{e.preventDefault();go('applications')}}>Applications</a></div>{['New','Reviewing','Approved','Rejected'].map(s=><div className="list-row" key={s}><strong>{s==='Reviewing'?'Under Review':s}</strong><span className="right">{s==='Approved'?186:s==='Rejected'?30:s==='New'?18:14}</span><span className="right muted">{s==='Approved'?'75%':s==='Rejected'?'12.1%':s==='New'?'7.3%':'5.6%'}</span></div>)}</div></div></div><div className="panel table-card"><div className="panel-pad"><div className="section-title"><h2>Recent Applications</h2></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>Applicant / Business</th><th>Type</th><th>Event</th><th>Amount</th><th>Payment</th><th>Status</th></tr></thead><tbody>{db.applications.slice(0,5).map(a=><tr key={a.id}><td>{a.id}</td><td><strong>{a.applicant}</strong></td><td>{a.type}</td><td>{a.event}</td><td>{money(a.amount)}</td><td><Badge>{a.payment}</Badge></td><td><Badge>{a.status}</Badge></td></tr>)}</tbody></table></div></div></div></Page>}

function Applications({db,setDb}){const [q,setQ]=useState(''),[status,setStatus]=useState('All status'),[type,setType]=useState('All types'),[edit,setEdit]=useState(null);const list=db.applications.filter(a=>(!q||JSON.stringify(a).toLowerCase().includes(q.toLowerCase()))&&(status==='All status'||a.status===status)&&(type==='All types'||a.type===type));return <Page title="Applications" sub="Review, approve and manage applications" action={<button className="primary" onClick={()=>setEdit({applicant:'',email:'',phone:'',event:'PitchXPO Conclave',type:'Raise Funds',amount:99,payment:'Paid',status:'New',note:''})}><Plus size={16}/> Add Application</button>}><div className="panel table-card"><div className="toolbar"><div className="search"><input className="input" style={{width:'100%'}} placeholder="Search applications..." value={q} onChange={e=>setQ(e.target.value)}/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option>All status</option><option>New</option><option>Reviewing</option><option>Approved</option><option>Rejected</option></select><select value={type} onChange={e=>setType(e.target.value)}><option>All types</option><option>Raise Funds</option><option>Showcase</option><option>Investor Success Story</option></select></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>Applicant / Business</th><th>Type</th><th>Event</th><th>Amount</th><th>Payment</th><th>Status</th><th></th></tr></thead><tbody>{list.map(a=><tr key={a.id}><td>{a.id}</td><td><strong>{a.applicant}</strong><br/><span className="muted">{a.email}</span></td><td>{a.type}</td><td>{a.event}</td><td>{money(a.amount)}</td><td><Badge>{a.payment}</Badge></td><td><Badge>{a.status}</Badge></td><td><button className="icon-btn" onClick={()=>setEdit(a)}><Eye size={16}/></button></td></tr>)}</tbody></table></div></div>{edit&&<AppModal data={edit} close={()=>setEdit(null)} save={x=>{const isNew=!x.id;const n={...x,id:x.id||'PX-'+Math.floor(10000+Math.random()*89999),date:new Date().toISOString().slice(0,10),documents:x.documents||[]};setDb(d=>({...d,applications:isNew?[n,...d.applications]:d.applications.map(a=>a.id===n.id?n:a)}));setEdit(null)}}/>}</Page>}

function AppModal({data,close,save}){const [x,setX]=useState(data);const f=(k,v)=>setX({...x,[k]:v});return <div className="modal-backdrop" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">Application</div><h2>{x.id||'New Application'}</h2></div><button className="icon-btn" onClick={close}><X/></button></div><div className="modal-body"><div className="form-grid"><div className="field"><label>Applicant / Business</label><input className="input" value={x.applicant} onChange={e=>f('applicant',e.target.value)}/></div><div className="field"><label>Email</label><input className="input" value={x.email} onChange={e=>f('email',e.target.value)}/></div><div className="field"><label>Phone</label><input className="input" value={x.phone} onChange={e=>f('phone',e.target.value)}/></div><div className="field"><label>Event</label><input className="input" value={x.event} onChange={e=>f('event',e.target.value)}/></div><div className="field"><label>Type</label><select value={x.type} onChange={e=>f('type',e.target.value)}><option>Raise Funds</option><option>Showcase</option><option>Investor Success Story</option></select></div><div className="field"><label>Amount (USD)</label><input className="input" type="number" value={x.amount} onChange={e=>f('amount',Number(e.target.value))}/></div><div className="field"><label>Payment</label><select value={x.payment} onChange={e=>f('payment',e.target.value)}><option>Paid</option><option>Unpaid</option></select></div><div className="field"><label>Status</label><select value={x.status} onChange={e=>f('status',e.target.value)}><option>New</option><option>Reviewing</option><option>Approved</option><option>Rejected</option></select></div><div className="field full"><label>Admin Note</label><textarea value={x.note||''} onChange={e=>f('note',e.target.value)}/></div></div></div><div className="modal-foot"><button className="secondary" onClick={close}>Cancel</button><button className="primary" onClick={()=>save(x)}>Save Application</button></div></div></div>}

function Payments({db}){return <Page title="Payments" sub="Track paid and unpaid application payments" action={<button className="secondary" onClick={()=>downloadCSV('pitchxpo-payments.csv',db.payments)}> <Download size={15}/> Download Excel</button>}><div className="cards"><div className="card"><div className="card-label">Paid</div><div className="metric">{db.payments.filter(x=>x.status==='Paid').length}</div></div><div className="card"><div className="card-label">Unpaid</div><div className="metric">{db.payments.filter(x=>x.status==='Unpaid').length}</div></div><div className="card"><div className="card-label">Collected</div><div className="metric">{money(db.payments.filter(x=>x.status==='Paid').reduce((a,x)=>a+x.amount,0))}</div></div></div><div className="panel table-card"><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Application</th><th>Applicant</th><th>Type</th><th>Amount (USD)</th><th>Status</th><th>Date</th></tr></thead><tbody>{db.payments.map(p=><tr key={p.id}><td>{p.reference}</td><td>{p.application}</td><td><strong>{p.applicant}</strong></td><td>{p.type}</td><td>{money(p.amount)}</td><td><Badge>{p.status}</Badge></td><td>{p.date}</td></tr>)}</tbody></table></div></div></Page>}

function Events({db,setDb}){const [edit,setEdit]=useState(null);return <Page title="Events" sub="Manage event dates, venues and status" action={<button className="primary" onClick={()=>setEdit({name:'',fromDate:'',toDate:'',venue:'',status:'Open',applications:0})}><Plus size={16}/> Add Event</button>}><div className="panel table-card"><div className="table-wrap"><table><thead><tr><th>Event</th><th>From Date</th><th>To Date</th><th>Venue</th><th>Applications</th><th>Status</th><th></th></tr></thead><tbody>{db.events.map(e=><tr key={e.id}><td><strong>{e.name}</strong></td><td>{e.fromDate}</td><td>{e.toDate}</td><td>{e.venue}</td><td>{e.applications}</td><td><Badge>{e.status}</Badge></td><td><button className="icon-btn" onClick={()=>setEdit(e)}><Pencil size={15}/></button></td></tr>)}</tbody></table></div></div>{edit&&<SimpleModal title={edit.id?'Edit Event':'Add Event'} data={edit} fields={[['name','Event Name'],['fromDate','From Date','date'],['toDate','To Date','date'],['venue','Venue']]} selects={['status']} close={()=>setEdit(null)} save={x=>{const n={...x,id:x.id||'EV-'+String(db.events.length+1).padStart(3,'0')};setDb(d=>({...d,events:x.id?d.events.map(a=>a.id===n.id?n:a):[...d.events,n]}));setEdit(null)}}/>}</Page>}

function Types({db,setDb}){const [edit,setEdit]=useState(null);return <Page title="Types & Pricing" sub="Manage application categories and USD pricing" action={<button className="primary" onClick={()=>setEdit({name:'',description:'',price:99,active:true})}><Plus size={16}/> Add Type</button>}><div className="panel table-card"><div className="table-wrap"><table><thead><tr><th>Type</th><th>Description</th><th>Price (USD)</th><th>Status</th><th></th></tr></thead><tbody>{db.types.map(t=><tr key={t.id}><td><strong>{t.name}</strong></td><td>{t.description}</td><td>{money(t.price)}</td><td><Badge>{t.active?'Active':'Inactive'}</Badge></td><td><button className="icon-btn" onClick={()=>setEdit(t)}><Pencil size={15}/></button></td></tr>)}</tbody></table></div></div>{edit&&<SimpleModal title={edit.id?'Edit Type':'Add Type'} data={edit} fields={[['name','Type Name'],['description','Description'],['price','Price (USD)','number']]} close={()=>setEdit(null)} save={x=>{const n={...x,id:x.id||'TP-'+String(db.types.length+1).padStart(3,'0'),active:x.active!==false};setDb(d=>({...d,types:x.id?d.types.map(a=>a.id===n.id?n:a):[...d.types,n]}));setEdit(null)}}/>}</Page>}

function UsersPage({db,setDb}){const [edit,setEdit]=useState(null);return <Page title="Admin Users" sub="Manage administrator access" action={<button className="primary" onClick={()=>setEdit({name:'',email:'',role:'Reviewer',status:'Active'})}><Plus size={16}/> Add Admin</button>}><div className="panel table-card"><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>{db.users.map(u=><tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.role}</td><td><Badge>{u.status}</Badge></td><td><button className="icon-btn" onClick={()=>setEdit(u)}><Pencil size={15}/></button></td></tr>)}</tbody></table></div></div>{edit&&<SimpleModal title={edit.id?'Edit Admin':'Add Admin'} data={edit} fields={[['name','Name'],['email','Email','email']]} selects={['role','status']} close={()=>setEdit(null)} save={x=>{const n={...x,id:x.id||'USR-'+String(db.users.length+1).padStart(3,'0'),lastLogin:'—'};setDb(d=>({...d,users:x.id?d.users.map(a=>a.id===n.id?n:a):[...d.users,n]}));setEdit(null)}}/>}</Page>}

function SimpleModal({title,data,fields=[],selects=[],close,save}){const [x,setX]=useState(data);return <div className="modal-backdrop" onClick={close}><div className="modal small-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={close}><X/></button></div><div className="modal-body"><div className="form-grid">{fields.map(([k,l,t])=><div className="field" key={k}><label>{l}</label><input className="input" type={t||'text'} value={x[k]??''} onChange={e=>setX({...x,[k]:t==='number'?Number(e.target.value):e.target.value})}/></div>)}{selects.map(k=><div className="field" key={k}><label>{k[0].toUpperCase()+k.slice(1)}</label><select value={x[k]} onChange={e=>setX({...x,[k]:e.target.value})}>{(k==='role'?['Administrator','Reviewer','Finance']:k==='status'?['Active','Inactive']:['Open','Closed']).map(v=><option key={v}>{v}</option>)}</select></div>)}</div></div><div className="modal-foot"><button className="secondary" onClick={close}>Cancel</button><button className="primary" onClick={()=>save(x)}>Save</button></div></div></div>}

function Account({db}){return <Page title="My Account" sub="Manage your administrator profile"><div className="panel account-card"><div className="panel-pad"><div className="detail-grid"><div><div className="field"><label>Name</label><input className="input" value={db.account.name} readOnly/></div></div><div><div className="field"><label>Email</label><input className="input" value={db.account.email} readOnly/></div></div><div><div className="field"><label>Phone</label><input className="input" value={db.account.phone} readOnly/></div></div><div><div className="field"><label>Role</label><div className="role">{db.account.role}</div></div></div></div></div></div></Page>}
function Password(){return <Page title="Change Password" sub="Update your administrator password"><div className="panel"><div className="panel-pad" style={{maxWidth:620}}><div className="form-grid"><div className="field full"><label>Current Password</label><input className="input" type="password"/></div><div className="field"><label>New Password</label><input className="input" type="password"/></div><div className="field"><label>Confirm Password</label><input className="input" type="password"/></div></div><div className="actions" style={{marginTop:18}}><button className="primary" onClick={()=>alert('Password updated in this demo.')}>Update Password</button></div></div></div></Page>}
function Modal({title,onClose,children}){return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X/></button></div>{children}</div></div>}
function downloadCSV(filename,rows){const keys=Object.keys(rows[0]||{});const s=[keys.join(','),...rows.map(r=>keys.map(k=>`"${String(r[k]??'').replaceAll('"','""')}"`).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/csv'}));a.download=filename;a.click()}
createRoot(document.getElementById('root')).render(<App/>);
