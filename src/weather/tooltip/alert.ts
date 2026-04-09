/**
 * 天气预警 Tooltip
 * 职责：绑定天气预警悬停提示
 */

import { i18n } from '../../utils/i18n';
import { getIconSvg } from '../index';
import { weather_data } from '../weatherState';
import { getTime } from './time';

/**
 * 绑定天气预警悬停提示
 */
export function attachWeatherAlertTooltip(element: HTMLElement): void {
    const tooltip = document.querySelector("#weatherAlertTooltip") as HTMLElement | null;
    const cardsContainer = tooltip?.querySelector(".tooltip-cards-container") as HTMLElement | null;
    const cardTemplate = document.querySelector("#weatherAlerttooltipCardTemplate") as HTMLTemplateElement | null;
    const alertName = element.innerHTML;

    if (element.innerText === i18n('weather_alert_everything_ok')) return;

    element.addEventListener("mouseenter", () => {
        if (!cardsContainer || !cardTemplate) return;

        cardsContainer.innerHTML = "";

        const alerts = weather_data.weatherAlert.filter(item => item.alert === alertName);

        alerts.forEach(alert => {
            const cloned = cardTemplate.content.cloneNode(true) as DocumentFragment;
            const card = cloned.querySelector('.tooltip-card') as HTMLElement | null;
            if (!card) return;

            card.style.setProperty("--alert-color", alert.color);

            const tooltipTitle = card.querySelector(".tooltip-title");
            const sender = card.querySelector(".sender");
            const tooltipTimeText = card.querySelector(".tooltip-time .text");
            const tooltipTimeState = card.querySelector(".tooltip-time .state");
            const eventSeverity = card.querySelector(".event-severity .text");
            const eventTimingStart = card.querySelector(".event-timing .start .time");
            const eventTimingEnd = card.querySelector(".event-timing .end .time");
            const tooltipHeadline = card.querySelector(".tooltip-headline");
            const tooltipDescription = card.querySelector(".tooltip-description");
            const tooltipCriteria = card.querySelector(".tooltip-criteria");
            const tooltipInstructions = card.querySelector(".tooltip-instructions");
            const tooltipSource = card.querySelector(".tooltip-source");
            const tooltipIcon = card.querySelector(".tooltip-icon");

            if (tooltipTitle) tooltipTitle.textContent = alert.alert;
            if (sender) sender.textContent = alert.sender;
            if (tooltipTimeText) tooltipTimeText.textContent = getTime(alert.releaseTime, true);
            if (tooltipTimeState) tooltipTimeState.textContent = i18n(`weather_alert_${alert.status}`);
            const severityKey = `weather_alert_severity_${alert.level}`;
            const severityText = i18n(severityKey);
            if (eventSeverity) eventSeverity.textContent = severityText !== severityKey ? severityText : alert.level;
            if (eventTimingStart) eventTimingStart.textContent = getTime(alert.startTime, false);
            if (eventTimingEnd) eventTimingEnd.textContent = getTime(alert.endTime, false);
            if (tooltipHeadline) tooltipHeadline.textContent = alert.title;
            if (tooltipDescription) tooltipDescription.textContent = alert.description;
            if (tooltipCriteria) tooltipCriteria.textContent = alert.criteria;

            const instruction = alert.instruction?.split("\n").map(line => `<li>${line}</li>`).join("");
            if (instruction && tooltipInstructions) {
                const instructionsOl = tooltipInstructions.querySelector("ol") as HTMLElement | null;
                if (instructionsOl) {
                    instructionsOl.innerHTML = instruction;
                    (tooltipInstructions as HTMLElement).style.display = "block";
                }
            } else if (tooltipInstructions) {
                (tooltipInstructions as HTMLElement).style.display = "none";
            }

            if (tooltipSource) tooltipSource.textContent = alert.source;

            getIconSvg(`src/source/QWeather-Icons/icons/${alert.icon}.svg`)
                .then(svg => {
                    if (tooltipIcon) tooltipIcon.innerHTML = svg;
                });

            if (tooltip) {
                tooltip.style.display = "block";
                tooltip.classList.add("show", "glow");
            }
            card.classList.add("glow");

            cardsContainer.appendChild(card);
        });
    });

    element.addEventListener("mousemove", (e) => {
        const mouseEvent = e as MouseEvent;
        if (!tooltip) return;
        const tipWidth = tooltip.offsetWidth;
        const tipHeight = tooltip.offsetHeight;

        let left = mouseEvent.clientX + 20;
        let top = mouseEvent.clientY + 20;

        if (left + tipWidth > window.innerWidth - 20) left = mouseEvent.clientX - tipWidth - 20;
        if (top + tipHeight > window.innerHeight - 20) top = mouseEvent.clientY - tipHeight - 20;

        if (left < 20) left = 20;
        if (top < 20) top = 20;

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
    });

    element.addEventListener("mouseleave", () => {
        tooltip?.classList.remove("show", "glow");
        setTimeout(() => {
            if (!tooltip?.classList.contains("show")) {
                if (tooltip) tooltip.style.display = "none";
                if (cardsContainer) cardsContainer.innerHTML = "";
            }
        }, 250);
    });
}
