# Changelog: 09-11-2026

- [Monday]-[09/11/2026]-[18:50]-[Dylan Gamero] : Restored Gitflow convention by reverting main to release v0.7.0, moving dashboard and budgets completion to dedicated feature branch feat/frontend-home-dashboard-and-budgets, and updating Docker web container.
- [Monday]-[09/11/2026]-[19:00]-[Dylan Gamero] : Refactored financial charts in Home Dashboard (CashflowBarChart with continuous 6-month timeline, compact Y-axis, capitalized 3-letter months; CategoryDonutChart with non-overlapping center hole and scrollable category list; added view mode toggle with min-w-0 grid isolation).
- [Monday]-[09/11/2026]-[19:35]-[Dylan Gamero] : Fixed SVG color rendering (replaced raw CSS HSL tuples with high-contrast hex #a1a1aa and #27272a), resolved bar spacing with baseline pill indicators minPointSize=2, added income category support to CategoryDonutChart, and optimized layout to full width per chart.
