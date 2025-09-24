import React, { useEffect, useState, useMemo } from 'react';

const OfferHtmlRenderer = ({
  offer,
  htmlCode,
  handleAcceptQuote,
  handleAskQuestion,
  interactionDisabled,
  acceptTerms,
  setAcceptTerms,
  selectedServiceIds,
  setSelectedServiceIds,
  vatRate = 0.25,
  customerNotes,
  setCustomerNotes,
  AcceptedOffer,
}) => {
  const [renderedHtml, setRenderedHtml] = useState("");
  const [isRendered, setIsRendered] = useState(false);

  const acceptedServiceIds = useMemo(() => {
    if (!AcceptedOffer?.chosenServices) return new Set();
    try {
      const chosenServices = JSON.parse(AcceptedOffer.chosenServices);
      return new Set(chosenServices.map(s => s.id));
    } catch (e) {
      console.error("Failed to parse chosenServices:", e);
      return new Set();
    }
  }, [AcceptedOffer]);

  // Memoize the rendered HTML to avoid re-rendering on every state change
  const memoizedHtml = useMemo(() => {
    if (!htmlCode || !offer) return "";

    // Calculate totals based on selected services and overall discount
    const calculateTotals = () => {
      const subtotal = (offer.services || []).reduce((sum, s) => {
        if (s.isRequired || selectedServiceIds.has(s.id)) {
          const price = parseFloat(s.price) || 0;
          const quantity = parseFloat(s.quantity) || 1;
          const discount = parseFloat(s.discount) || 0;
          return sum + price * (1 - discount / 100) * quantity;
        }
        return sum;
      }, 0);

      const vat = subtotal * vatRate;
      const total = subtotal + vat;
      const overallDiscountAmount = subtotal * (offer.overallDiscount / 100);
      const totalAfterOverallDiscount = (subtotal - overallDiscountAmount) + vat;

      return { subtotal, vat, total: totalAfterOverallDiscount, overallDiscountAmount };
    };

    const { subtotal, vat, total, overallDiscountAmount } = calculateTotals();

    // Create a temporary DOM element to manipulate the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlCode;

    // Replace dynamic placeholders
    const replacements = {
      "{quotestitle}": offer.title || "",
      "{quotesdescription}": offer.description || "",
      "{Subtotaltext}": "Subtotal",
      "{Subtotalprice}": `${subtotal.toFixed(2)} ${offer.pricingTemplate?.currency?.symbol || ""}`,
      "{vattext}": `VAT (${vatRate * 100}%)`,
      "{vatprice}": `${vat.toFixed(2)} ${offer.pricingTemplate?.currency?.symbol || ""}`,
      "{totaltext}": "Total",
      "{totalprice}": `${total.toFixed(2)} ${offer.pricingTemplate?.currency?.symbol || ""}`,
      "{termstext}": "Terms & Conditions",
      "{termsDescription}": offer.terms || "",
    };

    for (const placeholder in replacements) {
      tempDiv.innerHTML = tempDiv.innerHTML.replace(new RegExp(placeholder, "g"), replacements[placeholder]);
    }
    
    // Services section
    const servicesContainer = tempDiv.querySelector("#mulipleserverdivmain");
    const templateDiv = tempDiv.querySelector("#mulipleserverdivrepated");

    if (servicesContainer && templateDiv) {
      const parentStyle = templateDiv.getAttribute("style");
      const checkboxStyle = templateDiv.querySelector(".service-checkbox")?.getAttribute("style");
      const infoStyle = templateDiv.querySelector("#mulipleservercheckboxinnerdiv")?.getAttribute("style");
      const titleStyle = templateDiv.querySelector(".service-title")?.getAttribute("style");
      const descriptionStyle = templateDiv.querySelector(".service-description")?.getAttribute("style");
      const priceStyle = templateDiv.querySelector(".service-price")?.getAttribute("style");

      servicesContainer.innerHTML = "";

      (offer.services || []).forEach((service, index) => {
        const serviceHtml = `
          <div class="service-item" style="${parentStyle}">
            <input 
              type="checkbox" 
              class="service-checkbox" 
              style="${checkboxStyle}"
              id="serviceCheckbox_${service.id}"
              data-service-id="${service.id}"
              data-is-required="${service.isRequired}"
              ${AcceptedOffer ? (acceptedServiceIds.has(service.id) ? "checked disabled" : "disabled") : (service.isRequired ? "checked disabled" : selectedServiceIds.has(service.id) ? "checked" : "")}


            />
            <div class="service-info" style="${infoStyle}">
              <div class="service-title" style="${titleStyle}">${service.name || ""}</div>
              <div class="service-description" style="${descriptionStyle}">${service.description || ""}</div>
            </div>
            <div class="service-price" style="${priceStyle}">${service.price.toFixed(2)} ${offer.pricingTemplate?.currency?.symbol || ""}</div>
          </div>
        `;
        servicesContainer.innerHTML += serviceHtml;
      });
    }

    // Customer Notes section
    const customerNotesContainer = tempDiv.querySelector("#customerNotesContainer");
    if (customerNotesContainer) {
      const labelStyle = customerNotesContainer.querySelector("#customerNoteslabel")?.getAttribute("style");
      const textareaStyle = customerNotesContainer.querySelector("#customerNotestextarea")?.getAttribute("style");
      const notesValue = AcceptedOffer?.rememberNotes || customerNotes;

      customerNotesContainer.innerHTML = `
        <label for="customerNotes" style="${labelStyle}" id="customerNoteslabel">
          Notes for us (optional):
        </label>
        <textarea id="customerNotestextarea" rows="3" style="${textareaStyle}" ${interactionDisabled ? "disabled" : ""}>${notesValue}</textarea>
      `;
    }

    // Optional: Render overall discount if available in the template
    if (offer.overallDiscount > 0) {
      const overallDiscountHtml = `
        <div style="display: flex; align-items: baseline; justify-content: space-between;">
          <span style="font-size: 14px; font-weight: 500;">Overall Discount</span>
          <strong style="font-size: 14px; font-weight: 700; color: #00d4f0;">-${overallDiscountAmount.toFixed(2)} ${offer.pricingTemplate?.currency?.symbol || ""}</strong>
        </div>
      `;
      const totalsDiv = tempDiv.querySelector(".totals");
      const totalRow = tempDiv.querySelector("#totalprice")?.closest("div");
      if (totalsDiv && totalRow) {
        totalRow.insertAdjacentHTML('beforebegin', overallDiscountHtml);
      }
    }

    // Set the final HTML to state
    return tempDiv.innerHTML;
  }, [offer, htmlCode, selectedServiceIds, interactionDisabled, customerNotes, AcceptedOffer, vatRate]);

  // Set initial selected services
  useEffect(() => {
    if (!offer || !setSelectedServiceIds) return;

    const initialSelection = new Set();
    // Add services from the quote's acceptedOffers if it exists
    if (AcceptedOffer && AcceptedOffer.chosenServices) {
      try {
        const chosenServices = JSON.parse(AcceptedOffer.chosenServices);
        chosenServices.forEach(service => initialSelection.add(service.id));
      } catch (e) {
        console.error("Failed to parse chosenServices:", e);
      }
    } else {
      // Otherwise, add all required services
      (offer.services || []).forEach(service => {
        if (service.isRequired) {
          initialSelection.add(service.id);
        }
      });
    }
    setSelectedServiceIds(initialSelection);
    setIsRendered(true);
  }, [offer, setSelectedServiceIds, AcceptedOffer]);

  // Attach event listeners after the DOM is rendered
  useEffect(() => {
    if (!isRendered) return;

    const rootElement = document.getElementById('offer-html-renderer-root');
    if (!rootElement) return;

    // Handle service checkbox changes
    const serviceCheckboxes = rootElement.querySelectorAll(".service-checkbox");
    serviceCheckboxes.forEach(checkbox => {
      const serviceId = parseInt(checkbox.dataset.serviceId, 10);
      const isRequired = checkbox.dataset.isRequired === 'true';

      checkbox.onchange = (e) => {
        if (!isRequired) {
          setSelectedServiceIds(prev => {
            const newSet = new Set(prev);
            if (e.target.checked) {
              newSet.add(serviceId);
            } else {
              newSet.delete(serviceId);
            }
            return newSet;
          });
        }
      };
    });

    // Handle accept quote button
    const acceptBtn = rootElement.querySelector("#acceptQuoteBtn");
    if (acceptBtn) {
      acceptBtn.onclick = handleAcceptQuote;
      acceptBtn.disabled = interactionDisabled;
    }

    // Handle ask question button
    const askBtn = rootElement.querySelector("#askQuestionBtn");
    if (askBtn) {
      askBtn.onclick = handleAskQuestion;
      askBtn.disabled = interactionDisabled;
    }

    // Handle terms checkbox
    const termsCheckbox = rootElement.querySelector("#acceptTermsCheckbox");
    if (termsCheckbox) {
      termsCheckbox.checked = acceptTerms;
      termsCheckbox.onchange = (e) => setAcceptTerms(e.target.checked);
      termsCheckbox.disabled = interactionDisabled;
    }

    // Handle customer notes textarea
    const notesTextarea = rootElement.querySelector("#customerNotestextarea");
    if (notesTextarea) {
      notesTextarea.value = AcceptedOffer?.rememberNotes || customerNotes;
      notesTextarea.oninput = (e) => setCustomerNotes(e.target.value);
    }

  }, [isRendered, interactionDisabled, acceptTerms, handleAcceptQuote, handleAskQuestion, setAcceptTerms, customerNotes, setCustomerNotes, setSelectedServiceIds, AcceptedOffer]);

  return <div id="offer-html-renderer-root" dangerouslySetInnerHTML={{ __html: memoizedHtml }} />;
};

export default OfferHtmlRenderer;