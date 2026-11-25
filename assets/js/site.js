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
      const fields=[["Name",data.get("name")],["Email",data.get("email")],["WhatsApp",data.get("phone")||"Not provided"],["Preferred expedition",data.get("trip")],["Travel dates",(data.get("start_date")||"Not selected")+" to "+(data.get("end_date")||"Not selected")],["Number of travellers",data.get("guests")||"Not provided"],["Travel style",data.get("style")||"Not specified"],["Message",data.get("message")||"No additional message"]];
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
          departure_id:null,
          start_date:String(data.get("start_date")),
          end_date:String(data.get("end_date")),
          travel_date:String(data.get("start_date")),
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

  const tourCalendar=document.querySelector("[data-tour-calendar]");
  if(tourCalendar&&window.supabase&&window.BWC_SUPABASE_URL&&window.BWC_SUPABASE_ANON_KEY){
    const dateClient=window.supabase.createClient(window.BWC_SUPABASE_URL,window.BWC_SUPABASE_ANON_KEY);
    const dateForm=document.querySelector("#booking-form");
    const startInput=dateForm?.querySelector('[name="start_date"]');
    const endInput=dateForm?.querySelector('[name="end_date"]');
    const submitButton=dateForm?.querySelector('[type="submit"]');
    const customLink=dateForm?.querySelector("[data-custom-date]");
    const customField=dateForm?.querySelector('[name="custom_dates"]');
    const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const plusDays=(date,n)=>{const x=new Date(date);x.setDate(x.getDate()+n);return x;};
    const iso=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
    const lastBookableDay=new Date(2028,11,31);
    const todayKey=iso(today),lastBookableKey=iso(lastBookableDay);
    const availableMonths=[];
    for(let month=new Date(today.getFullYear(),today.getMonth(),1);month<=new Date(lastBookableDay.getFullYear(),lastBookableDay.getMonth(),1);month=new Date(month.getFullYear(),month.getMonth()+1,1)){
      availableMonths.push(new Date(month.getFullYear(),month.getMonth(),1));
    }
    let viewYear=today.getFullYear(),viewMonth=today.getMonth();
    let unavailable=[];
    let start="",end="";
    const overlaps=(a,b)=>unavailable.some(x=>a<=x.end_date&&b>=x.start_date);
    const updateCustomLink=()=>{
      const requested=customField?.value?.trim()||"not specified";
      const picked=start?(start+(end?" to "+end:"")):"not selected";
      if(customLink)customLink.href="https://wa.me/6285190836669?text="+encodeURIComponent("Hello Borneo Wild Capture, I would like to request a custom date. Requested dates: "+(requested!=="not specified"?requested:picked)+". I understand these dates may need special arrangement and pricing. Please let me know the availability and custom rate.");
    };
    const renderCalendar=()=>{
      if(startInput)startInput.value=start;
      if(endInput)endInput.value=end;
      const completed=!!(start&&end);
      const invalid=completed&&(end<start||overlaps(start,end));
      if(submitButton)submitButton.disabled=!completed||invalid;

      const years=[...new Set(availableMonths.map(month=>month.getFullYear()))];
      if(!years.includes(viewYear))viewYear=years[0];
      const monthsForYear=availableMonths.filter(month=>month.getFullYear()===viewYear);
      if(!monthsForYear.some(month=>month.getMonth()===viewMonth))viewMonth=monthsForYear[0].getMonth();

      const yearOptions=years.map(year=>'<option value="'+year+'"'+(year===viewYear?' selected':'')+'>'+year+'</option>').join("");
      const monthOptions=availableMonths.map(month=>'<option value="'+month.getFullYear()+'-'+month.getMonth()+'"'+(month.getFullYear()===viewYear&&month.getMonth()===viewMonth?' selected':'')+'>'+month.toLocaleDateString(undefined,{month:"long",year:"numeric"})+'</option>').join("");
      const weekdays=Array.from({length:7},(_,i)=>new Date(2024,0,7+i).toLocaleDateString(undefined,{weekday:"short"}));
      const weekdayMarkup=weekdays.map(day=>'<span>'+day+'</span>').join("");
      const firstDay=new Date(viewYear,viewMonth,1);
      const daysInMonth=new Date(viewYear,viewMonth+1,0).getDate();
      const cells=[];
      for(let i=0;i<firstDay.getDay();i++)cells.push('<span class="tour-calendar-empty" aria-hidden="true"></span>');
      for(let day=1;day<=daysInMonth;day++){
        const date=new Date(viewYear,viewMonth,day),key=iso(date);
        const outsideRange=key<todayKey||key>lastBookableKey;
        const booked=unavailable.some(x=>key>=x.start_date&&key<=x.end_date);
        const disabled=outsideRange||booked;
        const selected=key===start||key===end;
        const between=!!(start&&end&&key>start&&key<end);
        const title=booked?"Already booked":(outsideRange?"After 31 December 2028":"Choose this date");
        const dateLabel=date.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
        cells.push('<button type="button" class="tour-date-day'+(selected?' is-selected':'')+(between?' is-between':'')+(outsideRange?' is-outside-range':'')+(booked?' is-booked':'')+'" data-date="'+key+'" aria-label="'+dateLabel+(booked?', already booked':'')+(outsideRange?', outside booking window':'')+'" '+(disabled?'disabled aria-disabled="true" title="'+title+'"':'')+'><strong>'+day+'</strong></button>');
      }
      let note="Select your start date, then select your end date. All dates between them are reserved exclusively for your trip.";
      if(start&&!end)note="Start date selected: "+start+". Now choose an available end date.";
      if(invalid)note="That range overlaps an existing booking. Choose another end date or use Ask for Custom Date.";
      if(completed&&!invalid)note="Selected: "+start+" to "+end+". This range will be checked again when your enquiry is saved.";
      tourCalendar.innerHTML='<div class="tour-calendar-controls"><label><span>Month</span><select data-calendar-month aria-label="Select calendar month">'+monthOptions+'</select></label><label><span>Year</span><select data-calendar-year aria-label="Select calendar year">'+yearOptions+'</select></label></div><p class="tour-calendar-title">Choose your dates · through 31 December 2028</p><div class="tour-calendar-weekdays" aria-hidden="true">'+weekdayMarkup+'</div><div class="tour-calendar-grid">'+cells.join("")+'</div><p class="tour-calendar-note">'+note+' Dates can be selected through 31 December 2028; booked dates remain unavailable.</p>';
      tourCalendar.querySelector("[data-calendar-month]")?.addEventListener("change",event=>{
        const [selectedYear,selectedMonth]=event.target.value.split("-").map(Number);
        viewYear=selectedYear;
        viewMonth=selectedMonth;
        renderCalendar();
      });
      tourCalendar.querySelector("[data-calendar-year]")?.addEventListener("change",event=>{
        viewYear=Number(event.target.value);
        const firstMonth=availableMonths.find(month=>month.getFullYear()===viewYear);
        if(firstMonth)viewMonth=firstMonth.getMonth();
        renderCalendar();
      });
      tourCalendar.querySelectorAll("[data-date]:not(:disabled)").forEach(button=>button.addEventListener("click",()=>{
        const chosen=button.dataset.date;
        if(!start||end||chosen<start){start=chosen;end="";}
        else if(overlaps(start,chosen)){end="";}
        else{end=chosen;}
        renderCalendar();updateCustomLink();
      }));
      updateCustomLink();
    };
    dateClient.rpc("get_unavailable_tour_date_ranges").then(({data,error})=>{
      if(error){
        tourCalendar.innerHTML='<p class="faq-load-message">Availability could not be checked. Please contact our team before booking.</p>';
        if(submitButton)submitButton.disabled=true;
        return;
      }
      unavailable=(data||[]).filter(x=>x.start_date&&x.end_date);
      renderCalendar();
    });
    customField?.addEventListener("input",updateCustomLink);
    dateForm?.addEventListener("submit",event=>{
      if(!start||!end||end<start||overlaps(start,end)){
        event.preventDefault();
        renderCalendar();
        tourCalendar.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });
  }
  const year=document.querySelector("[data-current-year]");if(year)year.textContent=String(new Date().getFullYear());
})();