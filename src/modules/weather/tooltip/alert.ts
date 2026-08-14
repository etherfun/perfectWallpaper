/**
 * 天气预警 Tooltip
 * 职责：绑定天气预警悬停提示
 */

import { globalT } from '@/utils/i18n';

import { getIconSvg, iconSvgPath } from '../index';
import { weather_data } from '../weatherState';
import { hideTooltipAfter, positionTooltip } from './position';
import { getTime } from './time';

/**
 * 绑定天气预警悬停提示
 */
export function attachWeatherAlertTooltip(element: HTMLElement): void {
    const tooltip = document.querySelector('#weatherAlertTooltip') as HTMLElement | null;
    const cardsContainer = tooltip?.querySelector('.tooltip-cards-container') as HTMLElement | null;
    const cardTemplate = document.querySelector(
        '#weatherAlerttooltipCardTemplate'
    ) as HTMLTemplateElement | null;
    const alertName = element.innerHTML;

    if (element.innerText === globalT('weather_alert_everything_ok')) return;

    element.addEventListener('mouseenter', () => {
        if (!cardsContainer || !cardTemplate) return;

        cardsContainer.innerHTML = '';

        const alerts = weather_data.weatherAlert.filter(item => item.alert === alertName);

        alerts.forEach(alert => {
            const cloned = cardTemplate.content.cloneNode(true) as DocumentFragment;
            const card = cloned.querySelector('.tooltip-card') as HTMLElement | null;
            if (!card) return;

            card.style.setProperty('--alert-color', alert.color);

            const tooltipTitle = card.querySelector('.tooltip-title');
            const sender = card.querySelector('.sender');
            const tooltipTimeText = card.querySelector('.tooltip-time .text');
            const tooltipTimeState = card.querySelector('.tooltip-time .state');
            const eventSeverity = card.querySelector('.event-severity .text');
            const eventTimingStart = card.querySelector('.event-timing .start .time');
            const eventTimingEnd = card.querySelector('.event-timing .end .time');
            const tooltipHeadline = card.querySelector('.tooltip-headline');
            const tooltipDescription = card.querySelector('.tooltip-description');
            const tooltipCriteria = card.querySelector('.tooltip-criteria');
            const tooltipInstructions = card.querySelector('.tooltip-instructions');
            const tooltipSource = card.querySelector('.tooltip-source');
            const tooltipIcon = card.querySelector('.tooltip-icon');

            if (tooltipTitle) tooltipTitle.textContent = alert.alert;
            if (sender) sender.textContent = alert.sender;
            if (tooltipTimeText) tooltipTimeText.textContent = getTime(alert.releaseTime, true);
            if (tooltipTimeState)
                tooltipTimeState.textContent = globalT(`weather_alert_${alert.status}`);
            const severityKey = `weather_alert_severity_${alert.level}`;
            const severityText = globalT(severityKey);
            if (eventSeverity)
                eventSeverity.textContent =
                    severityText !== severityKey ? severityText : alert.level;
            if (eventTimingStart) eventTimingStart.textContent = getTime(alert.startTime, false);
            if (eventTimingEnd) eventTimingEnd.textContent = getTime(alert.endTime, false);
            if (tooltipHeadline) tooltipHeadline.textContent = alert.title;
            if (tooltipDescription) tooltipDescription.textContent = alert.description;
            if (tooltipCriteria) tooltipCriteria.textContent = alert.criteria;

            const instruction = alert.instruction
                ?.split('\n')
                .map(line => `<li>${line}</li>`)
                .join('');
            if (instruction && tooltipInstructions) {
                const instructionsOl = tooltipInstructions.querySelector(
                    'ol'
                ) as HTMLElement | null;
                if (instructionsOl) {
                    instructionsOl.innerHTML = instruction;
                    (tooltipInstructions as HTMLElement).style.display = 'block';
                }
            } else if (tooltipInstructions) {
                (tooltipInstructions as HTMLElement).style.display = 'none';
            }

            if (tooltipSource) tooltipSource.textContent = alert.source;

            getIconSvg(iconSvgPath(alert.icon)).then(svg => {
                if (tooltipIcon) tooltipIcon.innerHTML = svg;
            });

            if (tooltip) {
                tooltip.style.display = 'block';
                tooltip.classList.add('show', 'glow');
            }
            card.classList.add('glow');

            cardsContainer.appendChild(card);
        });
    });

    element.addEventListener('mousemove', e => {
        if (!tooltip) return;
        positionTooltip(tooltip, e as MouseEvent);
    });

    element.addEventListener('mouseleave', () => {
        if (!tooltip) return;
        tooltip.classList.remove('show', 'glow');
        hideTooltipAfter(tooltip, 250, () => {
            if (cardsContainer) cardsContainer.innerHTML = '';
        });
    });
}
