const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// ================= CONFIG =================
const config = {
  token: "TOKEN",
  clientId: "CLIENT_ID",
  guildId: "SUNUCU_ID",
  logChannelId: "LOG_KANAL_ID",
  ownerId: "SAHİP_ID"
};
// ==========================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages
  ]
});

// ================= SLASH COMMAND =================
const commands = [
  new SlashCommandBuilder()
    .setName("yetkili-basvuru")
    .setDescription("Yetkili başvurusu yap")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
    console.log("✅ Slash komut yüklendi");
  } catch (err) {
    console.error("❌ Slash komut yüklenemedi:", err);
  }
})();

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  // ===== SLASH =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "yetkili-basvuru") {

      const modal = new ModalBuilder()
        .setCustomId("yetkili_basvuru_modal")
        .setTitle("🛡️ Yetkili Başvuru Formu");

      const isim = new TextInputBuilder()
        .setCustomId("isim")
        .setLabel("İsminiz")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const yas = new TextInputBuilder()
        .setCustomId("yas")
        .setLabel("Yaşınız")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const aktiflik = new TextInputBuilder()
        .setCustomId("aktiflik")
        .setLabel("Günde kaç saat aktifsiniz?")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const neden = new TextInputBuilder()
        .setCustomId("neden")
        .setLabel("Neden yetkili olmak istiyorsunuz?")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(isim),
        new ActionRowBuilder().addComponents(yas),
        new ActionRowBuilder().addComponents(aktiflik),
        new ActionRowBuilder().addComponents(neden)
      );

      await interaction.showModal(modal);
    }
  }

  // ===== MODAL =====
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "yetkili_basvuru_modal") {

      await interaction.deferReply({ ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor("#f1c40f")
        .setTitle("📥 Yeni Yetkili Başvurusu")
        .addFields(
          { name: "👤 Kullanıcı", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "📛 İsim", value: interaction.fields.getTextInputValue("isim"), inline: true },
          { name: "🎂 Yaş", value: interaction.fields.getTextInputValue("yas"), inline: true },
          { name: "⏰ Aktiflik", value: interaction.fields.getTextInputValue("aktiflik") },
          { name: "📝 Neden?", value: interaction.fields.getTextInputValue("neden") }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`onay_${interaction.user.id}`)
          .setLabel("✅ Onayla")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`red_${interaction.user.id}`)
          .setLabel("❌ Reddet")
          .setStyle(ButtonStyle.Danger)
      );

      const logChannel = await client.channels.fetch(config.logChannelId);
      await logChannel.send({ embeds: [embed], components: [row] });

      await interaction.editReply({
        content: "✅ Başvurun başarıyla gönderildi!"
      });
    }
  }

  // ===== BUTTON =====
  if (interaction.isButton()) {

    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({
        content: "❌ Bu işlemi sadece bot sahibi yapabilir.",
        ephemeral: true
      });
    }

    const [action, userId] = interaction.customId.split("_");
    const user = await client.users.fetch(userId);

    if (action === "onay") {
      await user.send("🎉 **Tebrikler!** Yetkili başvurun **ONAYLANDI**.");

      await interaction.update({
        components: [],
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0])
            .setColor("Green")
            .setFooter({ text: "✅ ONAYLANDI" })
        ]
      });
    }

    if (action === "red") {
      await user.send("❌ **Üzgünüz!** Yetkili başvurun **REDDEDİLDİ**.");

      await interaction.update({
        components: [],
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0])
            .setColor("Red")
            .setFooter({ text: "❌ REDDEDİLDİ" })
        ]
      });
    }
  }
});

// ================= LOGIN =================
client.login(config.token);
