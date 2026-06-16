/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `Arena Fitness Tracker`,
    description: `Acompanhe seus treinos de musculação, corrida e natação com gamificação e retrospectiva semanal.`,
    siteUrl: `https://arena-fitness-tracker.netlify.app`,
  },
  plugins: [
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Arena Fitness Tracker`,
        short_name: `ArenaFit`,
        start_url: `/`,
        background_color: `#0B0F19`,
        theme_color: `#8B5CF6`,
        display: `standalone`,
        icon: `src/images/icon.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-offline`,
  ],
}

