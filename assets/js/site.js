(() => {
  const menuButton=document.querySelector(".menu-toggle"),nav=document.querySelector(".primary-nav");
  if(menuButton&&nav){
    menuButton.addEventListener("click",()=>{const open=menuButton.getAttribute("aria-expanded")!=="true";menuButton.setAttribute("aria-expanded",String(open));menuButton.setAttribute("aria-label",open?"Close navigation":"Open navigation");nav.classList.toggle("is-open",open);});
    nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{menuButton.setAttribute("aria-expanded","false");nav.classList.remove("is-open");}));
    document.addEventListener("keydown",event=>{if(event.key==="Escape"){menuButton.setAttribute("aria-expanded","false");nav.classList.remove("is-open");}});
  }
  const revealItems=document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window&&revealItems.length){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target);}}),{threshold:.12});revealItems.forEach(item=>observer.observe(item));}
  else revealItems.forEach(item=>item.classList.add("is-visible"));
  const buttons=document.querySelectorAll("[data-lightbox]"),dialog=document.querySelector(".lightbox");
  if(buttons.length&&dialog&&typeof dialog.showModal==="function"){
    const image=dialog.querySelector("img"),label=dialog.querySelector("[data-lightbox-label]"),close=dialog.querySelector(".lightbox-close");let previousFocus=null;
    buttons.forEach(button=>button.addEventListener("click",()=>{const source=button.querySelector("img");if(!source)return;previousFocus=button;image.src=source.currentSrc||source.src;image.alt=source.alt||"Borneo wildlife photograph";label.textContent=button.dataset.caption||source.alt||"Borneo wildlife";dialog.showModal();close.focus();}));
    const closeDialog=()=>{if(dialog.open)dialog.close();};close.addEventListener("click",closeDialog);dialog.addEventListener("click",event=>{if(event.target===dialog)closeDialog();});
    dialog.addEventListener("close",()=>{image.removeAttribute("src");if(previousFocus&&previousFocus.isConnected)previousFocus.focus();});
  }
  const form=document.querySelector("#booking-form");
  if(form){
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      if(!form.reportValidity())return;
      const submitButton=form.querySelector('[type="submit"]');
      const originalButtonText=submitButton.textContent;
      const data=new FormData(form);
      const fields=[["Name",data.get("name")],["Email",data.get("email")],["WhatsApp",data.get("phone")||"Not provided"],["Preferred expedition",data.get("trip")],["Travel date",data.get("date")||"Flexible / to be discussed"],["Number of travellers",data.get("guests")||"Not provided"],["Travel style",data.get("style")||"Not specified"],["Message",data.get("message")||"No additional message"]];
      const message="Hello Borneo Wild Capture, I have submitted a booking enquiry.\\n\\n"+fields.map(item=>item[0]+": "+item[1]).join("\\n");
      let status=form.querySelector("[data-booking-status]");
      if(!status){status=document.createElement("p");status.className="booking-note";status.dataset.bookingStatus="";status.setAttribute("role","status");form.append(status);}
      submitButton.disabled=true;
      submitButton.textContent="Saving your enquiry…";
      if(!window.supabase||!window.BWC_SUPABASE_URL||!window.BWC_SUPABASE_ANON_KEY){
        status.textContent="Booking is temporarily unavailable. Please contact us directly on WhatsApp.";
        submitButton.disabled=false;submitButton.textContent=originalButtonText;return;
      }
      try{
        const client=window.supabase.createClient(window.BWC_SUPABASE_URL,window.BWC_SUPABASE_ANON_KEY);
        const {error}=await client.from("bookings").insert({
          name:String(data.get("name")).trim(),
          email:String(data.get("email")).trim(),
          phone:String(data.get("phone")||"").trim()||null,
          trip:String(data.get("trip")),
          travel_date:String(data.get("date")||"")||null,
          guests:Number(data.get("guests")),
          travel_style:String(data.get("style")||"")||null,
          message:String(data.get("message")||"").trim()||null,
          status:"new"
        });
        if(error)throw error;
        status.textContent="Your enquiry has been saved. Opening WhatsApp so you can send the details to our team…";
        submitButton.textContent="Enquiry saved — opening WhatsApp";
        window.location.href="https://wa.me/6285190836669?text="+encodeURIComponent(message);
      }catch(error){
        console.error("Booking submission failed:",error);
        status.textContent="We couldn't save your enquiry. Please try again, or contact us directly on WhatsApp. Your details have not been submitted.";
        submitButton.disabled=false;submitButton.textContent=originalButtonText;
      }
    });
  }
  const publicFaqs=document.querySelector("[data-public-faqs]");
  if(publicFaqs&&window.supabase&&window.BWC_SUPABASE_URL&&window.BWC_SUPABASE_ANON_KEY){
    const faqClient=window.supabase.createClient(window.BWC_SUPABASE_URL,window.BWC_SUPABASE_ANON_KEY);
    const escapeFaq=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    faqClient.from("faqs").select("question,answer").eq("is_published",true).order("sort_order",{ascending:true}).order("created_at",{ascending:true}).then(({data,error})=>{
      if(error){publicFaqs.innerHTML='<p class="faq-load-message">FAQs are temporarily unavailable. Please contact our team for assistance.</p>';return;}
      if(!data||!data.length){publicFaqs.innerHTML='<p class="faq-load-message">Frequently asked questions will be published here soon.</p>';return;}
      publicFaqs.innerHTML=data.map(item=>'<details><summary>'+escapeFaq(item.question)+'</summary><p>'+escapeFaq(item.answer).replace(/\\n/g,"<br>")+'</p></details>').join("");
    });
  }
  const publicPackages=document.querySelector("[data-public-packages]");
  if(publicPackages&&window.supabase&&window.BWC_SUPABASE_URL&&window.BWC_SUPABASE_ANON_KEY){
    const packageClient=window.supabase.createClient(window.BWC_SUPABASE_URL,window.BWC_SUPABASE_ANON_KEY);
    const escapePackage=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    packageClient.from("packages").select("name,duration,price_note,description").eq("is_active",true).order("created_at",{ascending:true}).then(({data,error})=>{
      if(error){publicPackages.innerHTML='<p class="faq-load-message">Expedition packages are temporarily unavailable. Please contact our team.</p>';return;}
      if(!data||!data.length){publicPackages.innerHTML='<p class="faq-load-message">Expedition packages will be published here soon.</p>';return;}
      publicPackages.innerHTML=data.map(item=>'<article class="detail-card"><p class="kicker">'+escapePackage(item.duration)+'</p><h3>'+escapePackage(item.name)+'</h3><p>'+escapePackage(item.description)+'</p><p class="package-price-note">'+escapePackage(item.price_note)+'</p><div class="action-row"><a class="button button--gold" href="booking.html">Enquire about this trip ↗</a></div></article>').join("");
    });
  }
  const year=document.querySelector("[data-current-year]");if(year)year.textContent=String(new Date().getFullYear());
})();