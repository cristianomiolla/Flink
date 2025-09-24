import{r as n,s as _}from"./index-CRZ081Ij.js";function b(o){const[m,u]=n.useState([]),[p,l]=n.useState(null),[h,c]=n.useState(!0),[v,d]=n.useState(null);return n.useEffect(()=>{if(!o)return;(async()=>{try{c(!0),d(null);const{data:i,error:g}=await _.from("reviews").select(`
            id,
            booking_id,
            client_id,
            artist_id,
            rating,
            comment,
            created_at
          `).eq("artist_id",o).order("created_at",{ascending:!1});if(g){if(console.error("Error fetching reviews:",g),g.message?.includes('relation "public.reviews" does not exist')){console.warn("Reviews table does not exist yet. Using empty state."),u([]),l({average_rating:0,total_reviews:0,rating_distribution:{1:0,2:0,3:0,4:0,5:0}}),c(!1);return}d("Errore nel caricamento delle recensioni");return}let t=[];if(i&&i.length>0){const f=[...new Set(i.map(e=>e.client_id))],{data:s,error:a}=await _.from("profiles").select("user_id, full_name, username, avatar_url").in("user_id",f);a&&console.error("Error fetching client profiles:",a);const r=new Map;s&&s.forEach(e=>{r.set(e.user_id,e)}),t=i.map(e=>({id:e.id,booking_id:e.booking_id,client_id:e.client_id,artist_id:e.artist_id,rating:e.rating,comment:e.comment,created_at:e.created_at,client_profile:r.get(e.client_id)||null}))}if(u(t),t.length>0){const s=t.reduce((r,e)=>r+e.rating,0)/t.length,a={1:0,2:0,3:0,4:0,5:0};t.forEach(r=>{a[r.rating]=(a[r.rating]||0)+1}),l({average_rating:Math.round(s*10)/10,total_reviews:t.length,rating_distribution:a})}else l({average_rating:0,total_reviews:0,rating_distribution:{1:0,2:0,3:0,4:0,5:0}})}catch(i){console.error("Error in fetchReviews:",i),d("Errore nel caricamento delle recensioni")}finally{c(!1)}})()},[o]),{reviews:m,stats:p,loading:h,error:v}}export{b as u};
