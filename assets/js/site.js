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
  const bookingParams = new URLSearchParams(window.location.search);
  const tripLabels = {
    "essential-escape": "Essential Escape — 3 days / 2 nights",
    "wildlife-experience": "Wildlife Experience — 4 days / 3 nights",
    "wildlife-moments": "Wildlife Moments — 5 days / 4 nights"
  };
  const tripByPath = {
    "/itinerary-3d2n.html": "essential-escape",
    "/itinerary-4d3n.html": "wildlife-experience",
    "/itinerary-5d4n.html": "wildlife-moments"
  };
  const sourceLabels = {
    "itinerary-3d2n": "3 days / 2 nights itinerary",
    "itinerary-4d3n": "4 days / 3 nights itinerary",
    "itinerary-5d4n": "5 days / 4 nights itinerary"
  };
  let referrerPath = "";
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      if (referrerUrl.origin === window.location.origin) {
        referrerPath = referrerUrl.pathname.replace(/\/+$/, "") || "/";
      }
    } catch (_) {}
  }
  const bookingSourceLabel = sourceLabels[bookingParams.get("source") || ""]
    || (referrerPath === "/" || referrerPath === "/index.html" ? "Home page" : ({
      "/expeditions.html": "Expeditions page",
      "/itinerary-3d2n.html": "3 days / 2 nights itinerary",
      "/itinerary-4d3n.html": "4 days / 3 nights itinerary",
      "/itinerary-5d4n.html": "5 days / 4 nights itinerary"
    }[referrerPath] || "Booking page"));
  const form = document.querySelector("#booking-form");
  if (form) {
    const tripSelect = form.querySelector('[name="trip"]');
    const selectedTrip = tripLabels[bookingParams.get("trip") || ""]
      || tripLabels[tripByPath[referrerPath] || ""];
    if (selectedTrip && tripSelect) tripSelect.value = selectedTrip;

    const ensureStatus = () => {
      let status = form.querySelector("[data-booking-status]");
      if (!status) {
        status = document.createElement("p");
        status.className = "booking-note";
        status.dataset.bookingStatus = "";
        status.setAttribute("role", "status");
        form.append(status);
      }
      return status;
    };
    const addWhatsAppFallback = (status, url) => {
      let link = status.querySelector("[data-booking-whatsapp-fallback]");
      if (!link) {
        status.append(document.createElement("br"));
        link = document.createElement("a");
        link.dataset.bookingWhatsappFallback = "";
        link.className = "button button--outline";
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "Continue in WhatsApp";
        status.append(link);
      }
      link.href = url;
    };

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const status = ensureStatus();
      if (form.dataset.dateRangeValid !== "true") {
        status.textContent = "Please choose a valid available date range in the calendar before continuing.";
        form.querySelector("[data-tour-calendar]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const submitButton = form.querySelector('[type="submit"]');
      const originalButtonText = submitButton.textContent;
      const data = new FormData(form);
      const read = key => String(data.get(key) || "").trim();
      const customDates = read("custom_dates");
      const freeMessage = read("message");
      const whatsappMessage = [
        "Hello Borneo Wild Capture, I would like to enquire about an expedition.",
        "",
        "Name: " + (read("name") || "Not provided"),
        "Email: " + (read("email") || "Not provided"),
        "WhatsApp: " + (read("phone") || "Not provided"),
        "Preferred expedition: " + (read("trip") || "Not sure yet"),
        "Travel dates: " + (read("start_date") || "Not selected") + " to " + (read("end_date") || "Not selected"),
        "Requested custom dates: " + (customDates || "Not requested"),
        "Number of travellers: " + (read("guests") || "Not provided"),
        "Travel style: " + (read("style") || "Not specified"),
        "Enquiry source: " + bookingSourceLabel,
        "",
        "Message: " + (freeMessage || "No additional details provided."),
        "",
        "Please confirm availability and send a tailored quotation. I understand this enquiry is not a confirmed booking."
      ].join("\n");
      const whatsappUrl = "https://wa.me/6285190836669?text=" + encodeURIComponent(whatsappMessage);
      const storedMessage = [
        freeMessage,
        customDates ? "Requested custom dates: " + customDates : "",
        "Enquiry source: " + bookingSourceLabel
      ].filter(Boolean).join("\n\n");

      submitButton.disabled = true;
      submitButton.textContent = "Saving your enquiry…";

      if (!window.supabase || !window.BWC_SUPABASE_URL || !window.BWC_SUPABASE_ANON_KEY) {
        status.textContent = "We could not save this enquiry just now. You can still send the details directly to our team:";
        addWhatsAppFallback(status, whatsappUrl);
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }

      try {
        const client = window.supabase.createClient(window.BWC_SUPABASE_URL, window.BWC_SUPABASE_ANON_KEY);
        const { error } = await client.from("bookings").insert({
          name: read("name"),
          email: read("email"),
          phone: read("phone") || null,
          trip: read("trip"),
          departure_id: null,
          start_date: read("start_date"),
          end_date: read("end_date"),
          travel_date: read("start_date"),
          guests: Number(read("guests")),
          travel_style: read("style") || null,
          message: storedMessage || null,
          status: "new"
        });
        if (error) throw error;

        status.textContent = "Your enquiry has been saved. WhatsApp is opening; review the details and press Send to contact our team.";
        submitButton.textContent = "Opening WhatsApp…";
        window.location.assign(whatsappUrl);
      } catch (error) {
        console.error("Booking submission failed:", error);
        status.textContent = "We could not save your enquiry. Your details have not been recorded, but you can still send them directly to our team:";
        addWhatsAppFallback(status, whatsappUrl);
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
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
  if(publicPackages){
    const escapePackage=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    const packageFallback=[
      {name:"Essential Escape",duration:"3 days / 2 nights",description:"A short introduction to Tanjung Puting, with time on the river and guided rainforest experiences.",price_note:"Tailored quotation based on dates and group size.",tripKey:"essential-escape"},
      {name:"Wildlife Experience",duration:"4 days / 3 nights",description:"A balanced rainforest journey with more time to explore the river and wildlife habitats.",price_note:"Tailored quotation based on dates and group size.",tripKey:"wildlife-experience"},
      {name:"Wildlife Moments",duration:"5 days / 4 nights",description:"An unhurried expedition for a deeper experience of the rainforest and its waterways.",price_note:"Tailored quotation based on dates and group size.",tripKey:"wildlife-moments"}
    ];
    const renderPackages=items=>{
      publicPackages.innerHTML=items.map(item=>{
        const duration=String(item.duration||"").toLowerCase();
        const name=String(item.name||"").toLowerCase();
        const tripKey=item.tripKey||(((duration.includes("3")&&duration.includes("2"))||name.includes("essential"))?"essential-escape"
          :(((duration.includes("4")&&duration.includes("3"))||name.includes("experience"))?"wildlife-experience"
          :(((duration.includes("5")&&duration.includes("4"))||name.includes("moments"))?"wildlife-moments":"")));
        const bookingUrl="booking.html?source=expeditions"+(tripKey?"&trip="+tripKey:"");
        const message="Hello Borneo Wild Capture, I’m interested in the "+String(item.name||"")+" ("+String(item.duration||"")+" ) expedition. Could you share availability and a tailored quotation?";
        const whatsappUrl="https://wa.me/6285190836669?text="+encodeURIComponent(message);
        return '<article class="detail-card"><p class="kicker">'+escapePackage(item.duration)+'</p><h3>'+escapePackage(item.name)+'</h3><p>'+escapePackage(item.description)+'</p><p class="package-price-note">'+escapePackage(item.price_note)+'</p><div class="action-row expedition-cta-row"><a class="button button--gold" href="'+bookingUrl+'">Check Availability ↗</a><a class="button button--outline" href="'+whatsappUrl+'" target="_blank" rel="noopener">Private Quote ↗</a></div></article>';
      }).join("");
    };
    const showFallback=()=>{
      renderPackages(packageFallback);
      const note=document.createElement("p");
      note.className="faq-load-message";
      note.textContent="Showing sample expedition options. Contact our team to confirm current package details.";
      publicPackages.append(note);
    };
    if(!window.supabase||!window.BWC_SUPABASE_URL||!window.BWC_SUPABASE_ANON_KEY){
      showFallback();
    }else{
      try{
        const packageClient=window.supabase.createClient(window.BWC_SUPABASE_URL,window.BWC_SUPABASE_ANON_KEY);
        const request=packageClient.from("packages").select("name,duration,price_note,description").eq("is_active",true).order("created_at",{ascending:true});
        const timeout=new Promise((_,reject)=>window.setTimeout(()=>reject(new Error("Package request timed out")),8000));
        Promise.race([request,timeout]).then(({data,error})=>{
          if(error||!data||!data.length){showFallback();return;}
          renderPackages(data);
        }).catch(error=>{
          console.error("Expedition package loading failed:",error);
          showFallback();
        });
      }catch(error){
        console.error("Expedition package setup failed:",error);
        showFallback();
      }
    }
  }

  const tourCalendar = document.querySelector("[data-tour-calendar]");
  if (tourCalendar && window.supabase && window.BWC_SUPABASE_URL && window.BWC_SUPABASE_ANON_KEY) {
    const dateClient = window.supabase.createClient(window.BWC_SUPABASE_URL, window.BWC_SUPABASE_ANON_KEY);
    const dateForm = document.querySelector("#booking-form");
    const startInput = dateForm?.querySelector('[name="start_date"]');
    const endInput = dateForm?.querySelector('[name="end_date"]');
    const submitButton = dateForm?.querySelector('[type="submit"]');
    const customLink = dateForm?.querySelector("[data-custom-date]");
    const customField = dateForm?.querySelector('[name="custom_dates"]');
    const tripSelect = dateForm?.querySelector('[name="trip"]');
    const tripDurations = {
      "Essential Escape — 3 days / 2 nights": 2,
      "Wildlife Experience — 4 days / 3 nights": 3,
      "Wildlife Moments — 5 days / 4 nights": 4
    };
    const getTripNights = () => {
      const trip = tripSelect?.value || "";
      return Object.prototype.hasOwnProperty.call(tripDurations, trip) ? tripDurations[trip] : null;
    };
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const plusDays = (date, n) => { const x = new Date(date); x.setDate(x.getDate() + n); return x; };
    const iso = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    const lastBookableDay = new Date(2028, 11, 31);
    const todayKey = iso(today), lastBookableKey = iso(lastBookableDay);
    const availableMonths = [];
    for (let month = new Date(today.getFullYear(), today.getMonth(), 1); month <= new Date(lastBookableDay.getFullYear(), lastBookableDay.getMonth(), 1); month = new Date(month.getFullYear(), month.getMonth() + 1, 1)) {
      availableMonths.push(new Date(month.getFullYear(), month.getMonth(), 1));
    }
    let viewYear = today.getFullYear(), viewMonth = today.getMonth();
    let unavailable = [];
    let start = "", end = "", rangeNotice = "";
    if (dateForm) dateForm.dataset.dateRangeValid = "false";
    if (submitButton) submitButton.disabled = true;

    const overlaps = (a, b) => unavailable.some(x => a <= x.end_date && b >= x.start_date);
    const updateCustomLink = () => {
      const values = dateForm ? new FormData(dateForm) : null;
      const read = key => String(values?.get(key) || "").trim() || "Not provided";
      const requested = customField?.value?.trim() || (start && end ? start + " to " + end : "To be discussed with the team");
      if (customLink) {
        const lines = [
          "Hello Borneo Wild Capture, I would like to request a custom expedition date.",
          "",
          "Name: " + read("name"),
          "Email: " + read("email"),
          "WhatsApp: " + read("phone"),
          "Preferred expedition: " + read("trip"),
          "Requested dates: " + requested,
          "Number of travellers: " + read("guests"),
          "Travel style: " + read("style"),
          "Message: " + read("message"),
          "Enquiry source: " + bookingSourceLabel,
          "",
          "Please advise availability and a tailored quotation. I understand this is an enquiry, not a confirmed booking."
        ];
        customLink.href = "https://wa.me/6285190836669?text=" + encodeURIComponent(lines.join("\n"));
      }
    };

    const renderCalendar = () => {
      if (startInput) startInput.value = start;
      if (endInput) endInput.value = end;
      const tripNights = getTripNights();
      const completed = !!(start && end);
      const expectedEnd = tripNights !== null && start
        ? iso(plusDays(new Date(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1, Number(start.slice(8, 10))), tripNights))
        : "";
      const invalid = completed && (end < start || overlaps(start, end) || (tripNights !== null && end !== expectedEnd));
      if (dateForm) dateForm.dataset.dateRangeValid = String(completed && !invalid);
      if (submitButton) submitButton.disabled = !(completed && !invalid);

      const years = [...new Set(availableMonths.map(month => month.getFullYear()))];
      if (!years.includes(viewYear)) viewYear = years[0];
      const monthsForYear = availableMonths.filter(month => month.getFullYear() === viewYear);
      if (!monthsForYear.some(month => month.getMonth() === viewMonth)) viewMonth = monthsForYear[0].getMonth();

      const yearOptions = years.map(year => '<option value="' + year + '"' + (year === viewYear ? ' selected' : '') + '>' + year + '</option>').join("");
      const monthOptions = availableMonths.map(month => '<option value="' + month.getFullYear() + '-' + month.getMonth() + '"' + (month.getFullYear() === viewYear && month.getMonth() === viewMonth ? ' selected' : '') + '>' + month.toLocaleDateString(undefined, { month: "long", year: "numeric" }) + '</option>').join("");
      const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: "short" }));
      const weekdayMarkup = weekdays.map(day => '<span>' + day + '</span>').join("");
      const firstDay = new Date(viewYear, viewMonth, 1);
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < firstDay.getDay(); i++) cells.push('<span class="tour-calendar-empty" aria-hidden="true"></span>');
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(viewYear, viewMonth, day), key = iso(date);
        const outsideRange = key < todayKey || key > lastBookableKey;
        const booked = unavailable.some(x => key >= x.start_date && key <= x.end_date);
        const selected = key === start || key === end;
        const between = !!(start && end && key > start && key < end);
        const fixedTripEnd = tripNights !== null ? iso(plusDays(date, tripNights)) : "";
        const tooLateForTrip = tripNights !== null && fixedTripEnd > lastBookableKey;
        const overlapsTrip = tripNights !== null && !tooLateForTrip && !selected && !between && overlaps(key, fixedTripEnd);
        const unavailableForTrip = tooLateForTrip || overlapsTrip;
        const disabled = outsideRange || booked || unavailableForTrip;
        const title = booked ? "Already booked"
          : tooLateForTrip ? "This expedition must finish by 31 December 2028"
          : overlapsTrip ? "This expedition's full date range overlaps an existing booking"
          : outsideRange ? "Outside the available booking period"
          : "Choose this date";
        const dateLabel = date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        cells.push('<button type="button" class="tour-date-day' + (selected ? ' is-selected' : '') + (between ? ' is-between' : '') + (outsideRange ? ' is-outside-range' : '') + ((booked || unavailableForTrip) ? ' is-booked' : '') + '" data-date="' + key + '" aria-label="' + dateLabel + (booked ? ', already booked' : unavailableForTrip ? ', unavailable for this expedition length' : '') + '" ' + (disabled ? 'disabled aria-disabled="true" title="' + title + '"' : '') + '><strong>' + day + '</strong></button>');
      }

      const selectedTrip = tripSelect?.value || "your expedition";
      const flexibleDates = tripNights === null;
      let note = flexibleDates
        ? "Select your start date, then select an end date after it. Dates that overlap an existing booking are unavailable."
        : "Choose a start date. The end date is set automatically for " + selectedTrip + ".";
      if (rangeNotice) note = rangeNotice;
      if (start && !end && flexibleDates) note = "Start date selected: " + start + ". Now choose an end date after it.";
      if (completed && !invalid) {
        note = flexibleDates
          ? "Selected: " + start + " to " + end + ". This date range will be checked again when your enquiry is saved."
          : "Selected: " + start + " to " + end + ". Duration: " + (tripNights + 1) + " days / " + tripNights + " nights.";
      }

      tourCalendar.innerHTML = '<div class="tour-calendar-controls"><label><span>Month</span><select data-calendar-month aria-label="Select calendar month">' + monthOptions + '</select></label><label><span>Year</span><select data-calendar-year aria-label="Select calendar year">' + yearOptions + '</select></label></div><p class="tour-calendar-title">Choose your dates · through 31 December 2028</p><div class="tour-calendar-weekdays" aria-hidden="true">' + weekdayMarkup + '</div><div class="tour-calendar-grid">' + cells.join("") + '</div><p class="tour-calendar-note">' + note + '</p>';

      tourCalendar.querySelector("[data-calendar-month]")?.addEventListener("change", event => {
        const [selectedYear, selectedMonth] = event.target.value.split("-").map(Number);
        viewYear = selectedYear;
        viewMonth = selectedMonth;
        renderCalendar();
      });
      tourCalendar.querySelector("[data-calendar-year]")?.addEventListener("change", event => {
        viewYear = Number(event.target.value);
        const firstMonth = availableMonths.find(month => month.getFullYear() === viewYear);
        if (firstMonth) viewMonth = firstMonth.getMonth();
        renderCalendar();
      });
      tourCalendar.querySelectorAll("[data-date]:not(:disabled)").forEach(button => button.addEventListener("click", () => {
        const chosen = button.dataset.date;
        if (tripNights !== null) {
          const chosenDate = new Date(Number(chosen.slice(0, 4)), Number(chosen.slice(5, 7)) - 1, Number(chosen.slice(8, 10)));
          const calculatedEnd = iso(plusDays(chosenDate, tripNights));
          if (calculatedEnd > lastBookableKey) {
            start = "";
            end = "";
            rangeNotice = "This expedition must finish by 31 December 2028. Please choose an earlier start date.";
          } else if (overlaps(chosen, calculatedEnd)) {
            start = "";
            end = "";
            rangeNotice = "Those trip dates overlap an existing booking. Please choose another start date or request a custom date.";
          } else {
            start = chosen;
            end = calculatedEnd;
            rangeNotice = "";
          }
        } else if (!start || end || chosen < start) {
          start = chosen;
          end = "";
          rangeNotice = "";
        } else if (chosen <= start) {
          rangeNotice = "Choose an end date after the start date.";
        } else if (overlaps(start, chosen)) {
          end = "";
          rangeNotice = "That date range overlaps an existing booking. Choose a different end date or request a custom date.";
        } else {
          end = chosen;
          rangeNotice = "";
        }
        renderCalendar();
      }));
      updateCustomLink();
    };

    updateCustomLink();
    dateForm?.addEventListener("input", updateCustomLink);
    dateForm?.addEventListener("change", updateCustomLink);
    tripSelect?.addEventListener("change", () => {
      start = "";
      end = "";
      rangeNotice = "";
      renderCalendar();
    });

    dateClient.rpc("get_unavailable_tour_date_ranges").then(({ data, error }) => {
      if (error) {
        tourCalendar.innerHTML = '<p class="faq-load-message">Availability could not be checked. Please contact our team before selecting dates.</p>';
        if (dateForm) dateForm.dataset.dateRangeValid = "false";
        if (submitButton) submitButton.disabled = true;
        updateCustomLink();
        return;
      }
      unavailable = (data || []).filter(item => item.start_date && item.end_date);
      renderCalendar();
    });
  }
  const year=document.querySelector("[data-current-year]");if(year)year.textContent=String(new Date().getFullYear());
})();