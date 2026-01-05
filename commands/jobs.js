import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';
import config from '../config.json' assert { type: 'json' };

const jobsPath = path.join('./data/jobs.json');
fs.ensureFileSync(jobsPath);

export default {
  data: new SlashCommandBuilder()
    .setName('job')
    .setDescription('Apply for or view jobs')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Apply or view')
        .setRequired(true)
        .addChoices(
          { name: 'Apply', value: 'apply' },
          { name: 'View', value: 'view' }
        ))
    .addStringOption(opt =>
      opt.setName('job')
        .setDescription('Job name')
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.user.id;
    let jobs = fs.readJsonSync(jobsPath, { throws: false }) || {};

    const action = interaction.options.getString('action');
    const jobName = interaction.options.getString('job');

    // Define available jobs
    const availableJobs = ['Library', 'Workshop', 'Mail', 'Storage', 'Kitchen', 'Laundry'];
    const maxCrew = 3;

    if (action === 'view') {
      let jobInfo = availableJobs.map(j => {
        const crew = jobs[j]?.crew?.map(id => `<@${id}>`).join(', ') || 'None';
        return `**${j}**: ${crew}`;
      }).join('\n');
      return interaction.reply({ content: `**Jobs:**\n${jobInfo}`, ephemeral: true });
    }

    if (action === 'apply') {
      if (!jobName || !availableJobs.includes(jobName)) {
        return interaction.reply({ content: 'Invalid job name.', ephemeral: true });
      }

      jobs[jobName] ??= { crew: [] };
      if (jobs[jobName].crew.includes(userId)) {
        return interaction.reply({ content: 'You are already in this job.', ephemeral: true });
      }
      if (jobs[jobName].crew.length >= maxCrew) {
        return interaction.reply({ content: 'This job is full.', ephemeral: true });
      }

      // Add user as applicant (approval required by CO)
      jobs[jobName].crew.push(userId);
      fs.writeJsonSync(jobsPath, jobs);

      return interaction.reply({ content: `You applied for **${jobName}**. CO approval required.`, ephemeral: true });
    }
  }
};
